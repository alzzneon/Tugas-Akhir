<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\BaseResourceController;
use App\Models\VehicleBrand;
use Illuminate\Http\Request;

class VehicleBrandController extends BaseResourceController
{
    protected function model(): string
    {
        return VehicleBrand::class;
    }

    protected function storeRules(Request $request): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:mt_vehicle_brands,name'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    protected function updateRules(Request $request, int $id): array
    {
        return [
            'name' => ['required', 'string', 'max:255', "unique:mt_vehicle_brands,name,{$id}"],
            'is_active' => ['required', 'boolean'],
        ];
    }

    protected function transformForStore(array $validated): array
    {
        return [
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? true,
        ];
    }

    protected function transformForUpdate(array $validated, int $id): array
    {
        return [
            'name' => $validated['name'],
            'is_active' => $validated['is_active'],
        ];
    }
}
