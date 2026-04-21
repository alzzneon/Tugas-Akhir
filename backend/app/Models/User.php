<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, HasUuids;

    protected $table = 'users';

    protected $fillable = [
        'role',
        'full_name',
        'email',
        'password',
        'phone_number',
        'address',
        'birth_place',
        'birth_date',
        'position',
        'is_active',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $keyType = 'string';
    public $incrementing = false;

    protected $casts = [
        'birth_date' => 'date',
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
    ];
}