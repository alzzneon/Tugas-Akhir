<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    protected $table = 'mt_vehicles';

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ResourceController;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class VehicleController extends ResourceController
{
    public function index(Request $request)
    {
        $query = Vehicle::query()->with(['type', 'brand', 'transmission']);
        $typeCode = $request->input('type_code') ?? $request->input('type');
        if (!empty($typeCode)) {
            $query->whereHas('type', fn ($q) => $q->where('code', $typeCode));
        }

        if ($request->filled('q')) {
            $search = $request->string('q')->toString();
            $query->where(function ($w) use ($search) {
                $w->where('name', 'like', "%{$search}%")
                  ->orWhere('plate_number', 'like', "%{$search}%");
            });
        }

        $rows = $query->latest()->get();

        $data = $rows->map(fn ($v) => $this->vehicleToArray($v));

        return $this->success($data);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_type_id'  => ['required', 'integer', 'exists:mt_vehicle_types,id'],
            'vehicle_brand_id' => ['required', 'integer', 'exists:mt_vehicle_brands,id'],
            'transmission_id'  => ['nullable', 'integer', 'exists:mt_transmissions,id'],

            'name'         => ['required', 'string', 'max:120'],
            'plate_number' => ['required', 'string', 'max:20', 'unique:mt_vehicles,plate_number'],
            'year'         => ['nullable', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'color'        => ['nullable', 'string', 'max:50'],
            'daily_rate'   => ['required', 'numeric', 'min:0'],
            'description'  => ['nullable', 'string'],
            'is_active'    => ['nullable', 'boolean'],

            'image'        => ['nullable', 'image', 'max:5120'],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('vehicles', 'public');
        }

        $vehicle = Vehicle::create([
            'vehicle_type_id'  => $validated['vehicle_type_id'],
            'vehicle_brand_id' => $validated['vehicle_brand_id'],
            'transmission_id'  => $validated['transmission_id'] ?? null,

            'name'         => $validated['name'],
            'plate_number' => $validated['plate_number'],
            'year'         => $validated['year'] ?? null,
            'color'        => $validated['color'] ?? null,
            'daily_rate'   => $validated['daily_rate'],
            'description'  => $validated['description'] ?? null,
            'is_active'    => $validated['is_active'] ?? true,

            'image'        => $imagePath,
        ]);

        $vehicle->load(['type','brand','transmission']);

        return $this->created($this->vehicleToArray($vehicle));
    }

    public function update(Request $request, int $id)
    {
        $vehicle = Vehicle::query()->findOrFail($id);

        $validated = $request->validate([
            'vehicle_type_id'  => ['required', 'integer', 'exists:mt_vehicle_types,id'],
            'vehicle_brand_id' => ['required', 'integer', 'exists:mt_vehicle_brands,id'],
            'transmission_id'  => ['nullable', 'integer', 'exists:mt_transmissions,id'],

            'name'         => ['required', 'string', 'max:120'],
            'plate_number' => [
                'required', 'string', 'max:20',
                Rule::unique('mt_vehicles', 'plate_number')->ignore($vehicle->id),
            ],
            'year'         => ['nullable', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'color'        => ['nullable', 'string', 'max:50'],
            'daily_rate'   => ['required', 'numeric', 'min:0'],
            'description'  => ['nullable', 'string'],
            'is_active'    => ['required', 'boolean'],

            'image'        => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            $newPath = $request->file('image')->store('vehicles', 'public');

            if ($vehicle->image && Storage::disk('public')->exists($vehicle->image)) {
                Storage::disk('public')->delete($vehicle->image);
            }

            $vehicle->image = $newPath;
        }

        $vehicle->fill([
            'vehicle_type_id'  => $validated['vehicle_type_id'],
            'vehicle_brand_id' => $validated['vehicle_brand_id'],
            'transmission_id'  => $validated['transmission_id'] ?? null,

            'name'         => $validated['name'],
            'plate_number' => $validated['plate_number'],
            'year'         => $validated['year'] ?? null,
            'color'        => $validated['color'] ?? null,
            'daily_rate'   => $validated['daily_rate'],
            'description'  => $validated['description'] ?? null,
            'is_active'    => $validated['is_active'],
        ]);

        $vehicle->save();
        $vehicle->load(['type','brand','transmission']);

        return $this->success($this->vehicleToArray($vehicle));
    }

    public function destroy(int $id)
    {
        $vehicle = Vehicle::query()->findOrFail($id);

        if ($vehicle->image && Storage::disk('public')->exists($vehicle->image)) {
            Storage::disk('public')->delete($vehicle->image);
        }

        $vehicle->delete();

        return $this->success(null, 'Deleted');
    }

    private function vehicleToArray(Vehicle $v): array
    {
        return [
            'id' => $v->id,

            'vehicle_type_id' => $v->vehicle_type_id,
            'vehicle_type_code' => $v->type?->code,
            'vehicle_type_name' => $v->type?->name,

            'vehicle_brand_id' => $v->vehicle_brand_id,
            'vehicle_brand_name' => $v->brand?->name,

            'transmission_id' => $v->transmission_id,
            'transmission_name' => $v->transmission?->name,

            'name' => $v->name,
            'plate_number' => $v->plate_number,
            'year' => $v->year,
            'color' => $v->color,
            'daily_rate' => $v->daily_rate,
            'description' => $v->description,
            'is_active' => (bool) $v->is_active,

            'image' => $v->image,
            'image_url' => $v->image ? url('storage/' . $v->image) : null,
        ];
    }
}
 $fillable = [
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
}
