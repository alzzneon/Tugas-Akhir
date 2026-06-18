<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaintenanceType extends Model
{
    protected $table = 'mt_maintenance_types';

    protected $fillable = [
        'name',
        'is_active',
    ];
}