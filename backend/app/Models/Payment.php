<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $table = 'payments';

    protected $fillable = [
        'rental_id',
        'amount',
        'payment_method',
        'payment_status',
        'payment_type',
        'provider',
        'provider_reference',
        'expired_at',
        'notes',
        'updated_at',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expired_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function rental()
    {
        return $this->belongsTo(Rental::class, 'rental_id');
    }
}