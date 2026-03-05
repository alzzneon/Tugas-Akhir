<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{

    // LOGIN
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required','email'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($request->only('email','password'))) {
            return response()->json([
                'message' => 'Email atau password salah'
            ],401);
        }

        $user = Auth::user();

        if(!$user->is_active){
            return response()->json([
                'message' => 'Akun tidak aktif'
            ],403);
        }

        $token = $user->createToken('rentcare')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user
        ]);
    }

}