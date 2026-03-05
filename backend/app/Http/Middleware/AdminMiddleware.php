<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if(!in_array($request->user()->role, ['admin','super_admin'])){
            return response()->json([
                'message' => 'Akses ditolak'
            ],403);
        }

        return $next($request);
    }
}