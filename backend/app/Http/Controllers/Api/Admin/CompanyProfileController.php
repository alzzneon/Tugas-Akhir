<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CompanyProfile;
use Illuminate\Http\Request;

class CompanyProfileController extends Controller
{
    public function index()
    {
        $profile = CompanyProfile::first();

        return response()->json($profile);
    }

    public function update(Request $request)
    {
        $request->validate([
            'alamat' => 'required',
            'phone'  => 'required',
            'email'  => 'required|email'
        ]);

        $profile = CompanyProfile::first();

        if (!$profile) {
            $profile = CompanyProfile::create([
                'alamat' => $request->alamat,
                'phone'  => $request->phone,
                'email'  => $request->email
            ]);
        } else {
            $profile->update([
                'alamat' => $request->alamat,
                'phone'  => $request->phone,
                'email'  => $request->email
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data perusahaan berhasil diperbarui',
            'data' => $profile
        ]);
    }
}