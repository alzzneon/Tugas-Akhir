<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rental extends Model
{
    protected $table = 'rentals';

    protected $fillable = [
        'user_id',
        'vehicle_id',
        'start_date',
        'end_date',
        'total_date',
        'total_price',
        'status',
        'actual_pickup_at',
        'actual_return_at',
        'payment_status',
        'payment_deadline',
        'approved_at',
        'approved_by',
        'rejected_at',
        'rejected_by',
        'rejection_reason',
        'dp_amount',
        'paid_amount',
        'remaining_amount',
        'updated_at',
        'overdue_started_at',
        'booking_code',
        'notes',
        'customer_name',
        'customer_phone',
        'customer_email',
        'pickup_method',
        'delivery_address',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'actual_pickup_at' => 'datetime',
        'actual_return_at' => 'datetime',
        'payment_deadline' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'overdue_started_at' => 'datetime',
        'total_date' => 'integer',
        'total_price' => 'decimal:2',
        'dp_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejectedBy()
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'rental_id');
    }

    public function lateFines()
    {
        return $this->hasMany(LateFine::class, 'rental_id');
    }
}