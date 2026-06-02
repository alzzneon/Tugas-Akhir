<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Rental;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getStats()
    {
        $totalVehicles = Vehicle::count();

        // GANTI is_available -> is_active
        $availableVehicles = Vehicle::where(
            'is_active',
            true
        )->count();

        $activeRentals = Rental::whereIn(
            'status',
            ['ongoing', 'overdue']
        )->count();

        $pendingRentals = Rental::where(
            'status',
            'pending'
        )->count();

        $todayRentals = Rental::whereDate(
            'created_at',
            today()
        )->count();

        $totalCustomers = User::where(
            'role',
            'customer'
        )->count();

        $totalRevenue = Payment::whereIn(
            'payment_status',
            ['settlement', 'capture']
        )->sum('amount');

        $recentRentals = Rental::with([
            'user',
            'vehicle'
        ])
        ->latest()
        ->limit(5)
        ->get();

        $topVehicles = Rental::select(
                'vehicle_id',
                DB::raw('count(*) as total')
            )
            ->with('vehicle')
            ->groupBy('vehicle_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'total_vehicles' => $totalVehicles,
                'available_vehicles' => $availableVehicles,
                'active_rentals' => $activeRentals,
                'pending_rentals' => $pendingRentals,
                'today_rentals' => $todayRentals,
                'total_customers' => $totalCustomers,
                'total_revenue' => $totalRevenue,
            ],
            'recent_rentals' => $recentRentals,
            'top_vehicles' => $topVehicles,
        ]);
    }
}