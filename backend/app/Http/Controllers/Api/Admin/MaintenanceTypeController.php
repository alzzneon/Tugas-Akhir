<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ResourceController;
use App\Models\MaintenanceType;
use Illuminate\Http\Request;

class MaintenanceTypeController extends ResourceController
{
    public function index()
    {
        $rows = MaintenanceType::query()
            ->orderBy('id')
            ->get();

        return $this->success($rows);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $row = MaintenanceType::create([
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return $this->created($row, 'Jenis maintenance berhasil ditambahkan.');
    }

    public function update(Request $request, int $id)
    {
        $row = MaintenanceType::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $row->update([
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? $row->is_active,
        ]);

        return $this->success($row, 'Jenis maintenance berhasil diperbarui.');
    }

    public function destroy(int $id)
    {
        $row = MaintenanceType::findOrFail($id);
        $row->delete();

        return $this->success(null, 'Jenis maintenance berhasil dihapus.');
    }
}