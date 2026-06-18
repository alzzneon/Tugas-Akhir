<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ResourceController;
use App\Models\MaintenanceType;
use App\Models\VehicleService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VehicleServiceController extends ResourceController
{
    public function maintenanceTypes()
    {
        $rows = MaintenanceType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return $this->success($rows);
    }

    public function index(Request $request)
    {
        $query = VehicleService::query()
            ->with([
                'vehicle:id,name,plate_number',
                'maintenanceType:id,name',
                'rental:id,booking_code',
                'damage:id,description,repair_cost,status',
            ])
            ->latest('id');

        if ($request->filled('vehicle_id')) {
            $query->where('vehicle_id', (int) $request->vehicle_id);
        }

        if ($request->filled('maintenance_type_id')) {
            $query->where('maintenance_type_id', (int) $request->maintenance_type_id);
        }

        if ($request->filled('condition_status')) {
            $query->where('condition_status', $request->condition_status);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('q')) {
            $search = $request->string('q')->toString();

            $query->where(function ($q) use ($search) {
                $q->where('service_type', 'ILIKE', "%{$search}%")
                    ->orWhere('description', 'ILIKE', "%{$search}%")
                    ->orWhereHas('vehicle', function ($vehicleQuery) use ($search) {
                        $vehicleQuery->where('name', 'ILIKE', "%{$search}%")
                            ->orWhere('plate_number', 'ILIKE', "%{$search}%");
                    });
            });
        }

        $rows = $query->get()
            ->map(fn (VehicleService $service) => $this->transformService($service));

        return $this->success($rows);
    }

    public function show(int $id)
    {
        $service = VehicleService::query()
            ->with([
                'vehicle:id,name,plate_number',
                'maintenanceType:id,name',
                'rental:id,booking_code',
                'damage:id,description,repair_cost,status',
            ])
            ->findOrFail($id);

        return $this->success($this->transformService($service));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => ['required', 'integer', 'exists:mt_vehicles,id'],
            'maintenance_type_id' => ['required', 'integer', 'exists:mt_maintenance_types,id'],
            'service_date' => ['required', 'date'],
            'condition_status' => [
                'required',
                Rule::in(['good', 'damaged']),
            ],
            'description' => ['nullable', 'string'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'started_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date', 'after_or_equal:started_at'],
            'status' => [
                'required',
                Rule::in(['planned', 'in_progress', 'completed', 'cancelled']),
            ],
            'next_service_date' => ['nullable', 'date', 'after_or_equal:service_date'],
        ]);

        $maintenanceType = MaintenanceType::findOrFail($validated['maintenance_type_id']);

        $service = VehicleService::create([
            'vehicle_id' => $validated['vehicle_id'],
            'maintenance_type_id' => $validated['maintenance_type_id'],
            'service_date' => $validated['service_date'],
            'service_type' => $maintenanceType->name,
            'condition_status' => $validated['condition_status'],
            'description' => $validated['description'] ?? null,
            'cost' => $validated['cost'] ?? 0,
            'started_at' => $validated['started_at'] ?? null,
            'completed_at' => $validated['completed_at'] ?? null,
            'status' => $validated['status'],
            'next_service_date' => $validated['next_service_date'] ?? null,
        ]);

        $service->load([
            'vehicle:id,name,plate_number',
            'maintenanceType:id,name',
            'rental:id,booking_code',
            'damage:id,description,repair_cost,status',
        ]);

        return $this->created(
            $this->transformService($service),
            'Data maintenance kendaraan berhasil ditambahkan.'
        );
    }

    public function update(Request $request, int $id)
    {
        $service = VehicleService::findOrFail($id);

        $validated = $request->validate([
            'vehicle_id' => ['sometimes', 'required', 'integer', 'exists:mt_vehicles,id'],
            'maintenance_type_id' => ['sometimes', 'required', 'integer', 'exists:mt_maintenance_types,id'],
            'service_date' => ['sometimes', 'required', 'date'],
            'condition_status' => [
                'sometimes',
                'required',
                Rule::in(['good', 'damaged']),
            ],
            'description' => ['nullable', 'string'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'started_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date', 'after_or_equal:started_at'],
            'status' => [
                'sometimes',
                'required',
                Rule::in(['planned', 'in_progress', 'completed', 'cancelled']),
            ],
            'next_service_date' => ['nullable', 'date'],
        ]);

        if (isset($validated['maintenance_type_id'])) {
            $maintenanceType = MaintenanceType::findOrFail($validated['maintenance_type_id']);
            $validated['service_type'] = $maintenanceType->name;
        }

        if (($validated['status'] ?? null) === 'completed' && empty($validated['completed_at'])) {
            $validated['completed_at'] = now();
        }

        $service->update($validated);

        $service->load([
            'vehicle:id,name,plate_number',
            'maintenanceType:id,name',
            'rental:id,booking_code',
            'damage:id,description,repair_cost,status',
        ]);

        return $this->success(
            $this->transformService($service),
            'Data maintenance kendaraan berhasil diperbarui.'
        );
    }

    public function destroy(int $id)
    {
        $service = VehicleService::findOrFail($id);
        $service->delete();

        return $this->success(null, 'Data maintenance kendaraan berhasil dihapus.');
    }

    private function transformService(VehicleService $service): array
    {
        return [
            'id' => $service->id,
            'vehicle' => $service->vehicle ? [
                'id' => $service->vehicle->id,
                'name' => $service->vehicle->name,
                'plate_number' => $service->vehicle->plate_number,
            ] : null,
            'rental' => $service->rental ? [
                'id' => $service->rental->id,
                'booking_code' => $service->rental->booking_code,
            ] : null,
            'damage' => $service->damage ? [
                'id' => $service->damage->id,
                'description' => $service->damage->description,
                'repair_cost' => $service->damage->repair_cost,
                'status' => $service->damage->status,
            ] : null,
            'maintenance_type' => $service->maintenanceType ? [
                'id' => $service->maintenanceType->id,
                'name' => $service->maintenanceType->name,
            ] : null,
            'service_date' => optional($service->service_date)->toDateString(),
            'service_type' => $service->service_type,
            'condition_status' => $service->condition_status,
            'description' => $service->description,
            'cost' => $service->cost,
            'started_at' => optional($service->started_at)->toDateTimeString(),
            'completed_at' => optional($service->completed_at)->toDateTimeString(),
            'status' => $service->status,
            'next_service_date' => optional($service->next_service_date)->toDateString(),
            'created_at' => optional($service->created_at)->toDateTimeString(),
            'updated_at' => optional($service->updated_at)->toDateTimeString(),
        ];
    }
}