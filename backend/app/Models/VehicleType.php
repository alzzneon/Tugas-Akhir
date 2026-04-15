<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleType extends Model
{
    protected $table = 'mt_vehicle_types';

    protected $fillable = [
        'code',
        'name',
        'is_active',
        'late_fee_per_hour',
        'late_fee_threshold_hours',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'late_fee_per_hour' => 'decimal:2',
        'late_fee_threshold_hours' => 'integer',
    ];

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class, 'vehicle_type_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}