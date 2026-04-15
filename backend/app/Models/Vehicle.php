<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    protected $table = 'mt_vehicles';

    protected $fillable = [
        'vehicle_type_id',
        'vehicle_brand_id',
        'transmission_id',
        'name',
        'plate_number',
        'year',
        'color',
        'daily_rate',
        'description',
        'is_active',
        'image',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'year' => 'integer',
        'daily_rate' => 'decimal:2',
    ];

    public function type()
    {
        return $this->belongsTo(VehicleType::class, 'vehicle_type_id');
    }

    public function brand()
    {
        return $this->belongsTo(VehicleBrand::class, 'vehicle_brand_id');
    }

    public function transmission()
    {
        return $this->belongsTo(Transmission::class, 'transmission_id');
    }

    public function rentals()
    {
        return $this->hasMany(Rental::class, 'vehicle_id');
    }
}