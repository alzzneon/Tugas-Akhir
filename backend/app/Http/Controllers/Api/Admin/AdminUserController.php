<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index()
    {
        $admins = User::where('role', 'admin')->get();

        return response()->json($admins);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        if (!$user || $user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Hanya super admin yang bisa membuat admin'
            ], 403);
        }

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'phone_number' => 'required|string|max:30',
            'address' => 'required|string|max:255',
            'birth_place' => 'nullable|string|max:255',
            'birth_date' => 'nullable|date',
            'position' => 'nullable|string|max:255',
        ]);

        $admin = User::create([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
            'phone_number' => $validated['phone_number'],
            'address' => $validated['address'],
            'birth_place' => $validated['birth_place'] ?? null,
            'birth_date' => $validated['birth_date'] ?? null,
            'position' => $validated['position'] ?? null,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Admin berhasil dibuat',
            'data' => $admin
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();

        if (!$user || $user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Hanya super admin yang bisa update admin'
            ], 403);
        }

        $admin = User::findOrFail($id);

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($admin->id),
            ],
            'phone_number' => 'required|string|max:30',
            'address' => 'required|string|max:255',
            'birth_place' => 'nullable|string|max:255',
            'birth_date' => 'nullable|date',
            'position' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:6',
        ]);

        $payload = [
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'],
            'address' => $validated['address'],
            'birth_place' => $validated['birth_place'] ?? null,
            'birth_date' => $validated['birth_date'] ?? null,
            'position' => $validated['position'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        }

        $admin->update($payload);

        return response()->json([
            'message' => 'Admin berhasil diupdate',
            'data' => $admin
        ]);
    }

    public function destroy($id)
    {
        $user = auth()->user();

        if (!$user || $user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Hanya super admin yang bisa menghapus admin'
            ], 403);
        }

        $admin = User::findOrFail($id);
        $admin->delete();

        return response()->json([
            'message' => 'Admin berhasil dihapus'
        ]);
    }
}