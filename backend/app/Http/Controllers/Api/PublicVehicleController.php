<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicVehicleController extends Controller
{
    public function index(Request $request)
    {
        $type = strtoupper($request->query('type', '')); // MOBIL / MOTOR (optional)

        $q = DB::table('mt_vehicles as v')
            ->join('mt_vehicle_types as vt', 'vt.id', '=', 'v.vehicle_type_id')
            ->join('mt_vehicle_brands as vb', 'vb.id', '=', 'v.vehicle_brand_id')
            ->leftJoin('mt_transmissions as tr', 'tr.id', '=', 'v.transmission_id')
            ->where('v.is_active', true)
            ->select([
                'v.id',
                'v.vehicle_type_id',
                'v.vehicle_brand_id',
                'v.transmission_id',
                'v.name',
                'v.plate_number',
                'v.year',
                'v.color',
                'v.daily_rate',
                'v.description',
                'v.image',
                'v.is_active',
                'vt.code as vehicle_type_code',
                'vt.name as vehicle_type_name',
                'vb.name as vehicle_brand_name',
                'tr.name as transmission_name',
            ])
            ->orderByDesc('v.id');

        // filter MOBIL / MOTOR by master code
        if ($type !== '') {
            $q->whereRaw('UPPER(vt.code) = ?', [$type]);
        }

        // optional search
        if ($request->filled('q')) {
            $s = strtolower($request->query('q'));
            $q->where(function ($w) use ($s) {
                $w->whereRaw('LOWER(v.name) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(v.plate_number) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(vb.name) LIKE ?', ["%{$s}%"]);
            });
        }

        return response()->json($q->get());
    }
}
