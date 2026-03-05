<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // GET all users
    public function index()
    {
        return response()->json(User::all());
    }

    // INSERT user
    public function store(Request $request)
    {
        $request->validate([
            'role' => 'required|in:super_admin,admin,customer',
            'full_name' => 'required',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'phone_number' => 'required',
            'address' => 'required'
        ]);

        $user = User::create([
            'role' => $request->role,
            'full_name' => $request->full_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone_number' => $request->phone_number,
            'address' => $request->address,
            'birth_place' => $request->birth_place,
            'birth_date' => $request->birth_date,
            'position' => $request->position,
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'data' => $user
        ]);
    }

    // UPDATE user
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $user->update([
            'full_name' => $request->full_name ?? $user->full_name,
            'phone_number' => $request->phone_number ?? $user->phone_number,
            'address' => $request->address ?? $user->address,
            'birth_place' => $request->birth_place ?? $user->birth_place,
            'birth_date' => $request->birth_date ?? $user->birth_date,
            'position' => $request->position ?? $user->position,
        ]);

        return response()->json([
            'message' => 'User updated successfully',
            'data' => $user
        ]);
    }
}