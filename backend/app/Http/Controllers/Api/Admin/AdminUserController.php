<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    public function index()
    {
        $admins = User::where('role','admin')->get();
        return response()->json($admins);
    }

    // public function store(Request $request)
    // {
    //     if(auth()->user()->role !== 'super_admin'){
    //         return response()->json([
    //             'message'=>'Hanya super admin yang bisa membuat admin'
    //         ],403);
    //     }

    //     $request->validate([
    //         'full_name'=>'required',
    //         'email'=>'required|email|unique:users',
    //         'password'=>'required|min:6'
    //     ]);

    //     $admin = User::create([
    //         'full_name'=>$request->full_name,
    //         'email'=>$request->email,
    //         'password'=>Hash::make($request->password),
    //         'role'=>'admin',
    //         'is_active'=>true
    //     ]);

    //     return response()->json([
    //         'message'=>'Admin berhasil dibuat',
    //         'data'=>$admin
    //     ]);
    // }
public function store(Request $request)
{
    $user = auth()->user();

    if (!$user || $user->role !== 'super_admin') {
        return response()->json([
            'message' => 'Hanya super admin yang bisa membuat admin'
        ], 403);
    }

    $request->validate([
        'full_name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|string|min:6',
        'phone_number' => 'required|string|max:30',
        'address' => 'nullable|string',
        'birth_place' => 'nullable|string|max:255',
        'birth_date' => 'nullable|date',
        'position' => 'nullable|string|max:255',
    ]);

    $admin = User::create([
        'full_name' => $request->full_name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'role' => 'admin',
        'phone_number' => $request->phone_number,
        'address' => $request->address,
        'birth_place' => $request->birth_place,
        'birth_date' => $request->birth_date,
        'position' => $request->position,
        'is_active' => true
    ]);

    return response()->json([
        'message' => 'Admin berhasil dibuat',
        'data' => $admin
    ], 201);
}

    public function update(Request $request,$id)
    {
        if(auth()->user()->role !== 'super_admin'){
            return response()->json([
                'message'=>'Hanya super admin yang bisa update admin'
            ],403);
        }

        $admin = User::findOrFail($id);

        $admin->update($request->only([
            'full_name',
            'email',
            'phone_number',
            'address'
        ]));

        return response()->json([
            'message'=>'Admin berhasil diupdate',
            'data'=>$admin
        ]);
    }

    public function destroy($id)
    {
        if(auth()->user()->role !== 'super_admin'){
            return response()->json([
                'message'=>'Hanya super admin yang bisa menghapus admin'
            ],403);
        }

        $admin = User::findOrFail($id);
        $admin->delete();

        return response()->json([
            'message'=>'Admin berhasil dihapus'
        ]);
    }
}