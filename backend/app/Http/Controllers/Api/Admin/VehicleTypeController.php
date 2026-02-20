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
            'code' => ['required', 'string', 'max:50', 'unique:mt_vehicle_types,code'],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    protected function updateRules(Request $request, int $id): array
    {
        return [
            'code' => ['required', 'string', 'max:50', "unique:mt_vehicle_types,code,{$id}"],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    protected function transformForStore(array $validated): array
    {
        return [
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? true,
        ];
    }

    protected function transformForUpdate(array $validated, int $id): array
    {
        return [
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'is_active' => $validated['is_active'],
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
