<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next, $role = null)
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'message' => 'Akses ditolak.'
            ], 403);
        }

        if ($role && $user->role !== $role) {
            return response()->json([
                'message' => 'Akses hanya untuk Super Admin.'
            ], 403);
        }

        return $next($request);
    }
}