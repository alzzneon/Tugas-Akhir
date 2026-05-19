<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpCode extends Model
{
    protected $table = 'otp_codes';

    const PURPOSE_REGISTER = 'register';
    const PURPOSE_LOGIN = 'login';
    const PURPOSE_FORGOT_PASSWORD = 'forgot_password';
    const PURPOSE_EMAIL_VERIFICATION = 'email_verification';

    protected $fillable = [
        'user_id',
        'phone_number',
        'email',
        'otp_code',
        'purpose',
        'expired_at',
        'verified_at',
    ];

    protected $casts = [
        'expired_at' => 'datetime',
        'verified_at' => 'datetime',
    ];
}