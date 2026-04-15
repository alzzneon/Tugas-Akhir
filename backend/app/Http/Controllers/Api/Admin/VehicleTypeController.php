<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\BaseResourceController;
use App\Models\VehicleType;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class VehicleTypeController extends BaseResourceController
{
    protected function model(): string
    {
        return VehicleType::class;
    }

    protected function indexQuery(Request $request)
    {
        return VehicleType::query()->orderBy('name');
    }

    protected function storeRules(Request $request): array
    {
        return [
            'code' => ['required', 'string', 'max:20', 'unique:mt_vehicle_types,code'],
            'name' => ['required', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
            'late_fee_per_hour' => ['nullable', 'numeric', 'min:0'],
            'late_fee_threshold_hours' => ['nullable', 'integer', 'min:0'],
        ];
    }

    protected function updateRules(Request $request, int $id): array
    {
        return [
            'code' => ['required', 'string', 'max:20', "unique:mt_vehicle_types,code,{$id}"],
            'name' => ['required', 'string', 'max:100'],
            'is_active' => ['required', 'boolean'],
            'late_fee_per_hour' => ['nullable', 'numeric', 'min:0'],
            'late_fee_threshold_hours' => ['nullable', 'integer', 'min:0'],
        ];
    }

    protected function transformForStore(array $validated): array
    {
        return [
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? true,
            'late_fee_per_hour' => $validated['late_fee_per_hour'] ?? 0,
            'late_fee_threshold_hours' => $validated['late_fee_threshold_hours'] ?? 0,
        ];
    }

    protected function transformForUpdate(array $validated, int $id): array
    {
        return [
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'is_active' => $validated['is_active'],
            'late_fee_per_hour' => $validated['late_fee_per_hour'] ?? 0,
            'late_fee_threshold_hours' => $validated['late_fee_threshold_hours'] ?? 0,
        ];
    }

    public function destroy(int $id)
    {
        $modelClass = $this->model();
        $row = $modelClass::query()->findOrFail($id);

        try {
            $row->delete();
            return $this->success(null, 'Deleted');
        } catch (QueryException $e) {
            return $this->error('Tidak bisa dihapus karena masih digunakan.', 409);
        }
    }
}