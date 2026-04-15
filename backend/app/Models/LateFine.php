<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LateFine extends Model
{
    protected $table = 'late_fines';

    protected $fillable = [
        'rental_id',
        'daily_rate',
        'fine_per_day',
        'days_late',
        'total_fine',
        'late_minutes',
        'late_hours',
        'hourly_rate',
        'threshold_hours',
        'calculation_type',
        'status',
        'notes',
        'paid_at',
        'updated_at',
    ];

    protected $casts = [
        'daily_rate' => 'decimal:2',
        'fine_per_day' => 'decimal:2',
        'total_fine' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function rental()
    {
        return $this->belongsTo(Rental::class, 'rental_id');
    }
}