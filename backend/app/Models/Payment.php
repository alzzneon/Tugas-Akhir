<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [

        'rental_id',
        'amount',

        'payment_method',
        'payment_status',
        'payment_type',

        'provider',
        'provider_reference',

        'order_id',
        'transaction_id',

        'snap_token',
        'snap_redirect_url',

        'fraud_status',

        'transaction_time',
        'settlement_time',

        'bank',
        'va_number',

        'bill_key',
        'biller_code',

        'currency',

        'raw_response',

        'expired_at',
        'paid_at',

        'notes'
    ];

    protected $casts = [
        'raw_response' => 'array',
        'paid_at' => 'datetime',
        'expired_at' => 'datetime',
        'transaction_time' => 'datetime',
        'settlement_time' => 'datetime',
    ];

    public function rental()
    {
        return $this->belongsTo(Rental::class, 'rental_id');
    }
}