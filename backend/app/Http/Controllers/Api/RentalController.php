<?php

namespace App\Http\Controllers\Api;

use App\Models\Rental;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RentalController extends ResourceController
{
    public function index(Request $request)
    {
        $rows = Rental::query()
            ->with([
                'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
                'vehicle.type:id,code,name',
                'payments:id,rental_id,amount,payment_method,payment_status,payment_type,paid_at',
            ])
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->get()
            ->map(fn (Rental $r) => $this->transformRental($r));

        return $this->success($rows);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => ['required', 'integer', 'exists:mt_vehicles,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'notes' => ['nullable', 'string'],
        ]);

        $vehicle = Vehicle::query()
            ->where('is_active', true)
            ->findOrFail($validated['vehicle_id']);

        $start = Carbon::parse($validated['start_date']);
        $end = Carbon::parse($validated['end_date']);

        if ($this->hasConflict($vehicle->id, $start, $end)) {
            return $this->error('Jadwal kendaraan bentrok dengan rental lain.', 422);
        }

        $totalDays = max(1, (int) ceil($start->diffInHours($end) / 24));
        $totalPrice = $totalDays * (float) $vehicle->daily_rate;

        $rental = DB::transaction(function () use ($request, $validated, $vehicle, $start, $end, $totalDays, $totalPrice) {
            return Rental::create([
                'user_id' => $request->user()->id,
                'vehicle_id' => $vehicle->id,
                'start_date' => $start,
                'end_date' => $end,
                'total_date' => $totalDays,
                'total_price' => $totalPrice,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'dp_amount' => 0,
                'paid_amount' => 0,
                'remaining_amount' => $totalPrice,
                'booking_code' => $this->generateBookingCode(),
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        $rental->load([
            'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
            'vehicle.type:id,code,name',
        ]);

        return $this->created($this->transformRental($rental));
    }

    private function hasConflict(int $vehicleId, Carbon $start, Carbon $end): bool
    {
        return Rental::query()
            ->where('vehicle_id', $vehicleId)
            ->whereIn('status', ['pending', 'approved', 'waiting_payment', 'paid_partial', 'paid', 'ongoing', 'overdue'])
            ->where(function ($q) use ($start, $end) {
                $q->where('start_date', '<', $end)
                  ->where('end_date', '>', $start);
            })
            ->exists();
    }

    private function generateBookingCode(): string
    {
        $prefix = 'RNT-' . now()->format('Ymd');
        $lastId = (int) Rental::query()->max('id') + 1;

        return $prefix . '-' . str_pad((string) $lastId, 4, '0', STR_PAD_LEFT);
    }

    private function transformRental(Rental $r): array
    {
        return [
            'id' => $r->id,
            'booking_code' => $r->booking_code,
            'vehicle' => $r->vehicle ? [
                'id' => $r->vehicle->id,
                'name' => $r->vehicle->name,
                'plate_number' => $r->vehicle->plate_number,
                'daily_rate' => $r->vehicle->daily_rate,
                'vehicle_type' => $r->vehicle->type ? [
                    'id' => $r->vehicle->type->id,
                    'code' => $r->vehicle->type->code,
                    'name' => $r->vehicle->type->name,
                ] : null,
            ] : null,
            'start_date' => optional($r->start_date)->toDateTimeString(),
            'end_date' => optional($r->end_date)->toDateTimeString(),
            'total_date' => $r->total_date,
            'total_price' => $r->total_price,
            'status' => $r->status,
            'payment_status' => $r->payment_status,
            'dp_amount' => $r->dp_amount,
            'paid_amount' => $r->paid_amount,
            'remaining_amount' => $r->remaining_amount,
            'payment_deadline' => optional($r->payment_deadline)->toDateTimeString(),
            'notes' => $r->notes,
            'created_at' => optional($r->created_at)->toDateTimeString(),
        ];
    }
}