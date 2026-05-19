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
use App\Services\FonnteService;

class AuthController extends Controller
{
    private FonnteService $fonnte;

    private const OTP_EXPIRE_MINUTES = 5;

    public function __construct(FonnteService $fonnte)
    {
        $this->fonnte = $fonnte;
    }

public function sendRegisterOtp(Request $request)
{
    $validated = $request->validate([
        'phone_number' => ['required', 'string', 'max:20'],
    ]);

    $phone = trim($validated['phone_number']);

    $existingUser = User::where('phone_number', $phone)->first();

    if ($existingUser) {
        return response()->json([
            'message' => 'Nomor HP sudah terdaftar.'
        ], 422);
    }

    OtpCode::where('phone_number', $phone)
        ->where('purpose', OtpCode::PURPOSE_REGISTER)
        ->delete();

    $otp = (string) random_int(100000, 999999);

    OtpCode::create([
        'user_id' => null,
        'phone_number' => $phone,
        'email' => null,
        'otp_code' => Hash::make($otp),
        'purpose' => OtpCode::PURPOSE_REGISTER,
        'expired_at' => now()->addMinutes(self::OTP_EXPIRE_MINUTES),
        'verified_at' => null,
    ]);

    $this->fonnte->sendMessage(
        $phone,
        "Kode OTP Register RentCare Anda adalah: {$otp}\n\nJangan berikan kode ini kepada siapa pun."
    );

    return response()->json([
        'message' => 'Kode OTP berhasil dikirim ke WhatsApp.',
        'phone_number' => $phone,
        'expired_in_minutes' => self::OTP_EXPIRE_MINUTES,
    ]);
}

public function verifyRegisterOtp(Request $request)
{
    $validated = $request->validate([
        'phone_number' => ['required', 'string', 'max:20'],
        'otp' => ['required', 'digits:6'],
    ]);

    $phone = trim($validated['phone_number']);

    $otpRow = OtpCode::where('phone_number', $phone)
        ->where('purpose', OtpCode::PURPOSE_REGISTER)
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
        'phone_number' => $phone,
    ]);
}

public function completeRegister(Request $request)
{
    $validated = $request->validate([
        'full_name' => ['required', 'string', 'max:255'],
        'phone_number' => ['required', 'string', 'max:20'],
        'email' => ['nullable', 'email', 'max:255'],
        'address' => ['required', 'string'],
        'password' => ['required', 'min:6', 'confirmed'],
    ]);

    $phone = trim($validated['phone_number']);

    $verifiedOtp = OtpCode::where('phone_number', $phone)
        ->where('purpose', OtpCode::PURPOSE_REGISTER)
        ->whereNotNull('verified_at')
        ->latest('id')
        ->first();

    if (!$verifiedOtp) {
        return response()->json([
            'message' => 'Nomor HP belum diverifikasi.'
        ], 422);
    }

    $existingUser = User::where('phone_number', $phone)->first();

    if ($existingUser) {
        return response()->json([
            'message' => 'Nomor HP sudah terdaftar.'
        ], 422);
    }

    DB::beginTransaction();

    try {

        $user = User::create([
            'full_name' => $validated['full_name'],
            'phone_number' => $phone,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'],
            'password' => bcrypt($validated['password']),
            'role' => 'customer',
            'is_active' => true,
            'phone_verified_at' => now(),
            'email_verified_at' => null,
        ]);

        $verifiedOtp->update([
            'user_id' => $user->id,
        ]);

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
        'phone_number' => ['required', 'string', 'max:20'],
    ]);

    $phone = trim($validated['phone_number']);

    OtpCode::where('phone_number', $phone)
        ->where('purpose', OtpCode::PURPOSE_REGISTER)
        ->delete();

    $otp = (string) random_int(100000, 999999);

    OtpCode::create([
        'user_id' => null,
        'phone_number' => $phone,
        'otp_code' => Hash::make($otp),
        'purpose' => OtpCode::PURPOSE_REGISTER,
        'expired_at' => now()->addMinutes(self::OTP_EXPIRE_MINUTES),
        'verified_at' => null,
    ]);

    $this->fonnte->sendMessage(
        $phone,
        "Kode OTP baru RentCare Anda adalah: {$otp}"
    );

    return response()->json([
        'message' => 'OTP baru berhasil dikirim.',
        'phone_number' => $phone,
        'expired_in_minutes' => self::OTP_EXPIRE_MINUTES,
    ]);
}

public function login(Request $request)
{
    $validated = $request->validate([
        'phone_number' => ['required'],
        'password' => ['required'],
    ]);

    $phone = trim($validated['phone_number']);

    $user = User::where('phone_number', $phone)->first();

    if (!$user || !Hash::check($validated['password'], $user->password)) {
        return response()->json([
            'message' => 'Nomor HP atau password salah'
        ], 401);
    }

    if (!$user->is_active) {
        return response()->json([
            'message' => 'Akun tidak aktif'
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
            'phone_number' => $user->phone_number,
        ]
    ]);
}

}

