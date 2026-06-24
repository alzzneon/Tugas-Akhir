<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Rental;
use App\Models\User;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        $validated = $request->validate([
            'month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
        ]);

        $month = (int) ($validated['month'] ?? now()->month);
        $year = (int) ($validated['year'] ?? now()->year);

        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $totalVehicles = Vehicle::query()->count();

        $availableVehicles = Vehicle::query()
            ->where('is_active', true)
            ->count();

        $totalCustomers = User::query()
            ->where('role', 'customer')
            ->count();

        $newCustomers = User::query()
            ->where('role', 'customer')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        $rentalPeriodQuery = Rental::query()
            ->whereBetween('created_at', [$startDate, $endDate]);

        $totalRentals = (clone $rentalPeriodQuery)->count();

        $activeRentals = (clone $rentalPeriodQuery)
            ->whereIn('status', ['ongoing', 'overdue'])
            ->count();

        $pendingRentals = (clone $rentalPeriodQuery)
            ->where('status', 'pending')
            ->count();

        $completedRentals = (clone $rentalPeriodQuery)
            ->where('status', 'completed')
            ->count();

        $cancelledRentals = (clone $rentalPeriodQuery)
            ->whereIn('status', ['cancelled', 'rejected'])
            ->count();

        $totalRevenue = Payment::query()
            ->whereIn('payment_status', ['settlement', 'capture'])
            ->whereRaw(
                'COALESCE(paid_at, created_at) BETWEEN ? AND ?',
                [
                    $startDate->toDateTimeString(),
                    $endDate->toDateTimeString(),
                ]
            )
            ->sum('amount');

        $recentRentals = Rental::query()
            ->with([
                'user',
                'vehicle',
            ])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->latest()
            ->limit(5)
            ->get();

        $topVehicles = Rental::query()
            ->select(
                'vehicle_id',
                DB::raw('COUNT(*) as total')
            )
            ->with('vehicle')
            ->whereNotNull('vehicle_id')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('vehicle_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json([
            'period' => [
                'month' => $month,
                'year' => $year,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'label' => $startDate->translatedFormat('F Y'),
            ],
            'stats' => [
                'total_vehicles' => $totalVehicles,
                'available_vehicles' => $availableVehicles,
                'total_customers' => $totalCustomers,
                'new_customers' => $newCustomers,
                'total_rentals' => $totalRentals,
                'active_rentals' => $activeRentals,
                'pending_rentals' => $pendingRentals,
                'completed_rentals' => $completedRentals,
                'cancelled_rentals' => $cancelledRentals,
                'total_revenue' => $totalRevenue,
            ],
            'recent_rentals' => $recentRentals,
            'top_vehicles' => $topVehicles,
        ]);
    }
}