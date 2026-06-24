<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use App\Models\User;
use App\Services\FonnteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ForgotPasswordController extends Controller
{
    private FonnteService $fonnte;

    private const OTP_EXPIRE_MINUTES = 5;

    public function __construct(FonnteService $fonnte)
    {
        $this->fonnte = $fonnte;
    }

    public function sendOtp(Request $request)
    {
        $validated = $request->validate([
            'phone_number' => ['required', 'string', 'max:20'],
        ]);

        $phone = trim($validated['phone_number']);

        $user = User::query()
            ->where('phone_number', $phone)
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'Nomor HP tidak terdaftar.',
            ], 422);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Akun tidak aktif.',
            ], 403);
        }

        OtpCode::query()
            ->where('phone_number', $phone)
            ->where('purpose', 'forgot_password')
            ->delete();

        $otp = (string) random_int(100000, 999999);

        OtpCode::create([
            'user_id' => $user->id,
            'phone_number' => $phone,
            'email' => $user->email,
            'otp_code' => Hash::make($otp),
            'purpose' => 'forgot_password',
            'expired_at' => now()->addMinutes(self::OTP_EXPIRE_MINUTES),
            'verified_at' => null,
        ]);

        try {
            $this->fonnte->sendMessage(
                $phone,
                "Kode OTP Reset Password RentCare Anda adalah: {$otp}\n\nJangan berikan kode ini kepada siapa pun."
            );
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'OTP gagal dikirim ke WhatsApp.',
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'Kode OTP berhasil dikirim ke WhatsApp.',
            'phone_number' => $phone,
            'expired_in_minutes' => self::OTP_EXPIRE_MINUTES,
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $validated = $request->validate([
            'phone_number' => ['required', 'string', 'max:20'],
            'otp' => ['required', 'digits:6'],
        ]);

        $phone = trim($validated['phone_number']);

        $otpRow = OtpCode::query()
            ->where('phone_number', $phone)
            ->where('purpose', 'forgot_password')
            ->whereNull('verified_at')
            ->latest('id')
            ->first();

        if (!$otpRow) {
            return response()->json([
                'message' => 'OTP tidak ditemukan atau sudah digunakan.',
            ], 422);
        }

        if (now()->greaterThan($otpRow->expired_at)) {
            return response()->json([
                'message' => 'OTP sudah kedaluwarsa.',
            ], 422);
        }

        if (!Hash::check($validated['otp'], $otpRow->otp_code)) {
            return response()->json([
                'message' => 'Kode OTP salah.',
            ], 422);
        }

        $otpRow->update([
            'verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'OTP berhasil diverifikasi. Silakan buat password baru.',
            'phone_number' => $phone,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'phone_number' => ['required', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $phone = trim($validated['phone_number']);

        $otpRow = OtpCode::query()
            ->where('phone_number', $phone)
            ->where('purpose', 'forgot_password')
            ->whereNotNull('verified_at')
            ->latest('id')
            ->first();

        if (!$otpRow) {
            return response()->json([
                'message' => 'Nomor HP belum diverifikasi.',
            ], 422);
        }

        if (now()->greaterThan($otpRow->expired_at)) {
            return response()->json([
                'message' => 'Verifikasi OTP sudah kedaluwarsa. Silakan kirim ulang OTP.',
            ], 422);
        }

        $user = User::query()
            ->where('phone_number', $phone)
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        OtpCode::query()
            ->where('phone_number', $phone)
            ->where('purpose', 'forgot_password')
            ->delete();

        return response()->json([
            'message' => 'Password berhasil diperbarui. Silakan login kembali.',
        ]);
    }
}