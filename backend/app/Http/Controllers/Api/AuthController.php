<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    // Fungsi login untuk API (dipakai frontend saat admin/user login)
    public function login(Request $request)
    {
        //  Validasi input
        $request->validate([
            'email' => ['required','email'],
            'password' => ['required'],
        ]);

        // Cek inputan
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Email atau password salah'], 401);
        }

        // If login > buat token
        $user = $request->user(); 
        $token = $user->createToken('rentcare')->plainTextToken;

        //  Kirim token + data user ke frontend
        return response()->json([
            'token' => $token,
            'user' => [
                'id_user' => $user->id_user, 
                'name' => $user->name,       
                'email' => $user->email,     
            ],
        ]);
    }
}
 