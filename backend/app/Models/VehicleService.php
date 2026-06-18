<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleService extends Model
{
    protected $table = 'vehicle_services';

    protected $fillable = [
        'vehicle_id',
        'rental_id',
        'damage_id',
        'maintenance_type_id',
        'service_date',
        'service_type',
        'condition_status',
        'description',
        'cost',
        'started_at',
        'completed_at',
        'status',
        'next_service_date',
    ];

    protected $casts = [
        'service_date' => 'date',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'next_service_date' => 'date',
        'cost' => 'decimal:2',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function rental()
    {
        return $this->belongsTo(Rental::class, 'rental_id');
    }

    public function damage()
    {
        return $this->belongsTo(VehicleDamage::class, 'damage_id');
    }

    public function maintenanceType()
    {
        return $this->belongsTo(MaintenanceType::class, 'maintenance_type_id');
    }
}