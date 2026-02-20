<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class Customer extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'customers';
    protected $primaryKey = 'id';   // sesuai tabel customers kamu
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'password',
        'last_login',
        'last_ip',
        'is_active',
    ];

    protected $hidden = [
        'password',
    ];
}
