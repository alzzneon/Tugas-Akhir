<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rental;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PublicRentalController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => ['required', 'integer', 'exists:mt_vehicles,id'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'notes' => ['nullable', 'string'],
        ]);

        $vehicle = Vehicle::findOrFail($validated['vehicle_id']);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);

        $totalDays = $startDate->diffInDays($endDate) + 1;
        $totalPrice = $totalDays * (float) $vehicle->daily_rate;

        $notes = trim(
            "Customer: {$validated['customer_name']}\n" .
            "Phone: {$validated['customer_phone']}\n" .
            ($validated['notes'] ?? '')
        );

        $rental = Rental::create([
            'user_id' => null,
            'vehicle_id' => $vehicle->id,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'total_date' => $totalDays,
            'total_price' => $totalPrice,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'dp_amount' => 0,
            'paid_amount' => 0,
            'remaining_amount' => $totalPrice,
            'booking_code' => 'BK-' . strtoupper(Str::random(8)),
            'notes' => $notes,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Booking berhasil dibuat',
            'data' => $rental,
        ], 201);
    }
}