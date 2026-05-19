<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleDamage extends Model
{
    protected $table = 'vehicle_damages';

    protected $fillable = [
        'rental_id',
        'vehicle_id',
        'description',
        'repair_cost',
        'status',
        'repaired_by_customer',
        'paid_at',
    ];

    protected $casts = [
        'repair_cost' => 'decimal:2',
        'repaired_by_customer' => 'boolean',
        'paid_at' => 'datetime',
    ];

    public function rental()
    {
        return $this->belongsTo(Rental::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}