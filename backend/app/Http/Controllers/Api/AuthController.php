<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\SendOtpMail;
use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    private const OTP_EXPIRE_MINUTES = 5;

    public function sendRegisterOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $email = strtolower(trim($validated['email']));

        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            return response()->json([
                'message' => 'Email sudah terdaftar.'
            ], 422);
        }

        OtpCode::where('email', $email)
            ->where('purpose', 'register')
            ->delete();

        $otp = (string) random_int(100000, 999999);

        OtpCode::create([
            'user_id' => null,
            'email' => $email,
            'otp_code' => Hash::make($otp),
            'purpose' => 'register',
            'expired_at' => now()->addMinutes(self::OTP_EXPIRE_MINUTES),
            'verified_at' => null,
        ]);

        Mail::to($email)->send(new SendOtpMail($otp, 'OTP Registrasi RentCare'));

        return response()->json([
            'message' => 'Kode OTP berhasil dikirim ke email.',
            'email' => $email,
            'expired_in_minutes' => self::OTP_EXPIRE_MINUTES,
        ]);
    }

    public function verifyRegisterOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'otp' => ['required', 'digits:6'],
        ]);

        $email = strtolower(trim($validated['email']));

        $otpRow = OtpCode::where('email', $email)
            ->where('purpose', 'register')
            ->whereNull('verified_at')
            ->latest('id')
            ->first();

        if (!$otpRow) {
            return response()->json([
                'message' => 'OTP tidak ditemukan atau sudah digunakan.'
            ], 422);
        }

        if (now()->greaterThan($otpRow->expired_at)) {
            return response()->json([
                'message' => 'OTP sudah kedaluwarsa.'
            ], 422);
        }

        if (!Hash::check($validated['otp'], $otpRow->otp_code)) {
            return response()->json([
                'message' => 'Kode OTP salah.'
            ], 422);
        }

        $otpRow->update([
            'verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'OTP berhasil diverifikasi. Silakan lanjut isi data diri.',
            'email' => $email,
        ]);
    }

    public function completeRegister(Request $request)
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone_number' => ['required', 'string', 'max:20', 'unique:users,phone_number'],
            'address' => ['required', 'string'],
            'password' => ['required', 'min:6', 'confirmed'],
        ]);

        $email = strtolower(trim($validated['email']));

        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            return response()->json([
                'message' => 'Email sudah terdaftar.'
            ], 422);
        }

        $verifiedOtp = OtpCode::where('email', $email)
            ->where('purpose', 'register')
            ->whereNotNull('verified_at')
            ->latest('id')
            ->first();

        if (!$verifiedOtp) {
            return response()->json([
                'message' => 'Email belum diverifikasi dengan OTP.'
            ], 422);
        }

        DB::beginTransaction();

        try {
            $user = User::create([
                'full_name' => $validated['full_name'],
                'email' => $email,
                'phone_number' => $validated['phone_number'],
                'address' => $validated['address'],
                'password' => bcrypt($validated['password']),
                'role' => 'customer',
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            $verifiedOtp->update([
                'user_id' => $user->id,
            ]);

            OtpCode::where('email', $email)
                ->where('purpose', 'register')
                ->where('id', '!=', $verifiedOtp->id)
                ->delete();

            $token = $user->createToken('auth_token')->plainTextToken;

            DB::commit();

            return response()->json([
                'message' => 'Register berhasil',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'role' => $user->role,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'address' => $user->address,
                ]
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Registrasi gagal.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function resendRegisterOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $email = strtolower(trim($validated['email']));

        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            return response()->json([
                'message' => 'Email sudah terdaftar.'
            ], 422);
        }

        OtpCode::where('email', $email)
            ->where('purpose', 'register')
            ->delete();

        $otp = (string) random_int(100000, 999999);

        OtpCode::create([
            'user_id' => null,
            'email' => $email,
            'otp_code' => Hash::make($otp),
            'purpose' => 'register',
            'expired_at' => now()->addMinutes(self::OTP_EXPIRE_MINUTES),
            'verified_at' => null,
        ]);

        Mail::to($email)->send(new SendOtpMail($otp, 'Kirim Ulang OTP Registrasi'));

        return response()->json([
            'message' => 'OTP baru berhasil dikirim.',
            'email' => $email,
            'expired_in_minutes' => self::OTP_EXPIRE_MINUTES,
        ]);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $email = strtolower(trim($validated['email']));

        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Akun tidak aktif'
            ], 403);
        }

        if (empty($user->email_verified_at)) {
            return response()->json([
                'message' => 'Email belum diverifikasi'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'role' => $user->role,
                'full_name' => $user->full_name,
                'email' => $user->email,
            ]
        ]);
    }

    public function sendForgotPasswordOtp(Request $request)
{
    $validated = $request->validate([
        'email' => ['required', 'email', 'max:255'],
    ]);

    $email = strtolower(trim($validated['email']));

    $user = User::where('email', $email)->first();

    if (!$user) {
        return response()->json([
            'message' => 'Email tidak terdaftar.'
        ], 422);
    }

    OtpCode::where('email', $email)
        ->where('purpose', 'forgot_password')
        ->delete();

    $otp = (string) random_int(100000, 999999);

    OtpCode::create([
        'user_id' => $user->id,
        'email' => $email,
        'otp_code' => Hash::make($otp),
        'purpose' => 'forgot_password',
        'expired_at' => now()->addMinutes(self::OTP_EXPIRE_MINUTES),
        'verified_at' => null,
    ]);

    Mail::to($email)->send(new SendOtpMail($otp, 'OTP Reset Password RentCare'));

    return response()->json([
        'message' => 'Kode OTP reset password berhasil dikirim ke email.',
        'email' => $email,
        'expired_in_minutes' => self::OTP_EXPIRE_MINUTES,
    ]);
}

public function verifyForgotPasswordOtp(Request $request)
{
    $validated = $request->validate([
        'email' => ['required', 'email', 'max:255'],
        'otp' => ['required', 'digits:6'],
    ]);

    $email = strtolower(trim($validated['email']));

    $otpRow = OtpCode::where('email', $email)
        ->where('purpose', 'forgot_password')
        ->whereNull('verified_at')
        ->latest('id')
        ->first();

    if (!$otpRow) {
        return response()->json([
            'message' => 'OTP tidak ditemukan atau sudah digunakan.'
        ], 422);
    }

    if (now()->greaterThan($otpRow->expired_at)) {
        return response()->json([
            'message' => 'OTP sudah kedaluwarsa.'
        ], 422);
    }

    if (!Hash::check($validated['otp'], $otpRow->otp_code)) {
        return response()->json([
            'message' => 'Kode OTP salah.'
        ], 422);
    }

    $otpRow->update([
        'verified_at' => now(),
    ]);

    return response()->json([
        'message' => 'OTP reset password berhasil diverifikasi.',
        'email' => $email,
    ]);
}

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'min:6', 'confirmed'],
        ]);

        $email = strtolower(trim($validated['email']));

        $verifiedOtp = OtpCode::where('email', $email)
            ->where('purpose', 'forgot_password')
            ->whereNotNull('verified_at')
            ->latest('id')
            ->first();

        if (!$verifiedOtp) {
            return response()->json([
                'message' => 'OTP reset password belum diverifikasi.'
            ], 422);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User tidak ditemukan.'
            ], 404);
        }

        $user->update([
            'password' => bcrypt($validated['password']),
        ]);

        OtpCode::where('email', $email)
            ->where('purpose', 'forgot_password')
            ->delete();

        return response()->json([
            'message' => 'Password berhasil diperbarui. Silakan login kembali.'
        ]);
    }
}