<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpCode extends Model
{
    protected $table = 'otp_codes';

    protected $fillable = [
        'user_id',
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}