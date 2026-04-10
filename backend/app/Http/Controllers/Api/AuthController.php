<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,   // <-- INI YANG PENTING
                'role' => $user->role,
                'full_name' => $user->full_name,
                'email' => $user->email
            ]
        ]);
    }

    // public function register(Request $request)
    // {
    //     $request->validate([
    //         'full_name' => 'required|string|max:255',
    //         'email' => 'required|email|unique:users',
    //         'password' => 'required|min:6'
    //     ]);

    //     $user = User::create([
    //         'full_name' => $request->full_name,
    //         'email' => $request->email,
    //         'password' => bcrypt($request->password),
    //         'role' => 'customer'
    //     ]);

    //     $token = $user->createToken('auth_token')->plainTextToken;

    //     return response()->json([
    //         'token' => $token,
    //         'user' => $user
    //     ]);
    // }

    public function register(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone_number' => 'required|string|max:20|unique:users,phone_number',
            'address' => 'required|string',
            'password' => 'required|min:6|confirmed',
        ]);

        $user = User::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'address' => $request->address,
            'password' => bcrypt($request->password),
            'role' => 'customer',
            'is_active' => true,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Register berhasil',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'role' => $user->role,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'address' => $user->address,
            ]
        ], 201);
    }
}