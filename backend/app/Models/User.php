<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

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
        'is_active'
    ];

    protected $hidden = [
        'password'
    ];
}