<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    private function ensureSuperAdmin(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Hanya super admin yang dapat mengelola data admin.',
            ], 403);
        }

        return null;
    }

    public function index(Request $request)
    {
        if ($forbidden = $this->ensureSuperAdmin($request)) {
            return $forbidden;
        }

        $admins = User::query()
            ->where('role', 'admin')
            ->orderBy('id', 'desc')
            ->get()
            ->map(fn ($admin) => $this->transform($admin))
            ->values();

        return response()->json($admins);
    }

    public function store(Request $request)
    {
        if ($forbidden = $this->ensureSuperAdmin($request)) {
            return $forbidden;
        }

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone_number' => ['required', 'string', 'max:30', 'unique:users,phone_number'],
            'address' => ['required', 'string', 'max:255'],
            'birth_place' => ['required', 'string', 'max:255'],
            'birth_date' => ['required', 'date'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $admin = User::create([
            'role' => 'admin',
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone_number' => $validated['phone_number'],
            'phone_verified_at' => now(),
            'address' => $validated['address'],
            'birth_place' => $validated['birth_place'],
            'birth_date' => $validated['birth_date'],
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Admin berhasil dibuat.',
            'data' => $this->transform($admin),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        if ($forbidden = $this->ensureSuperAdmin($request)) {
            return $forbidden;
        }

        $admin = User::query()
            ->where('role', 'admin')
            ->findOrFail($id);

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($admin->id),
            ],
            'phone_number' => [
                'required',
                'string',
                'max:30',
                Rule::unique('users', 'phone_number')->ignore($admin->id),
            ],
            'address' => ['required', 'string', 'max:255'],
            'birth_place' => ['required', 'string', 'max:255'],
            'birth_date' => ['required', 'date'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        $payload = [
            'role' => 'admin',
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'],
            'phone_verified_at' => $admin->phone_verified_at ?? now(),
            'address' => $validated['address'],
            'birth_place' => $validated['birth_place'],
            'birth_date' => $validated['birth_date'],
            'is_active' => true,
            'email_verified_at' => $admin->email_verified_at ?? now(),
        ];

        if (!empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        }

        $admin->update($payload);

        return response()->json([
            'message' => 'Admin berhasil diperbarui.',
            'data' => $this->transform($admin->fresh()),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        if ($forbidden = $this->ensureSuperAdmin($request)) {
            return $forbidden;
        }

        $admin = User::query()
            ->where('role', 'admin')
            ->findOrFail($id);

        $admin->delete();

        return response()->json([
            'message' => 'Admin berhasil dihapus.',
        ]);
    }

    private function transform(User $admin): array
    {
        return [
            'id' => $admin->id,
            'role' => $admin->role,
            'full_name' => $admin->full_name,
            'email' => $admin->email,
            'phone_number' => $admin->phone_number,
            'phone_verified_at' => optional($admin->phone_verified_at)->toDateTimeString(),
            'address' => $admin->address,
            'birth_place' => $admin->birth_place,
            'birth_date' => $admin->birth_date
                ? Carbon::parse($admin->birth_date)->format('Y-m-d')
                : null,
            'is_active' => (bool) $admin->is_active,
            'email_verified_at' => optional($admin->email_verified_at)->toDateTimeString(),
            'created_at' => optional($admin->created_at)->toDateTimeString(),
            'updated_at' => optional($admin->updated_at)->toDateTimeString(),
        ];
    }
}