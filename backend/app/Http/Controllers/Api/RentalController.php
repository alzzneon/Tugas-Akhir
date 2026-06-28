<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\CreatesNotifications;
use App\Models\Rental;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RentalController extends ResourceController
{
    use CreatesNotifications;

    public function index(Request $request)
    {
        $rows = Rental::query()
            ->with([
                'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
                'vehicle.type:id,code,name',
                'payments:id,rental_id,amount,payment_method,payment_status,payment_type,paid_at',
                'lateFines:id,rental_id,total_fine,status,calculation_type,late_hours,late_minutes',
                'damages:id,rental_id,vehicle_id,description,repair_cost,status',
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
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'pickup_method' => ['required', 'in:pickup,delivery'],
            'delivery_address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        if (
            $validated['pickup_method'] === 'delivery' &&
            empty(trim((string) ($validated['delivery_address'] ?? '')))
        ) {
            return $this->error(
                'Alamat pengantaran wajib diisi jika metode pengambilan adalah diantar.',
                422
            );
        }

        if ($validated['pickup_method'] === 'pickup') {
            $validated['delivery_address'] = null;
        }

        $vehicle = Vehicle::query()
            ->where('is_active', true)
            ->findOrFail($validated['vehicle_id']);

        $start = Carbon::parse($validated['start_date'])
            ->setTime(7, 0, 0);

        $end = Carbon::parse($validated['end_date'])
            ->setTime(7, 0, 0);

        if ($end->lessThanOrEqualTo($start)) {
            $end = $start->copy()->addDay();
        }

        $totalDays = max(
            1,
            $start->diffInDays($end)
        );

        if ($this->hasConflict($vehicle->id, $start, $end)) {
            return $this->error(
                'Jadwal kendaraan bentrok dengan rental lain.',
                422
            );
        }

        $hasActiveRental = Rental::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('status', [
                'pending',
                'approved',
                'ongoing',
                'overdue',
                'inspection',
                'waiting_payment',
                'repair_process',
            ])
            ->exists();

        if ($hasActiveRental) {
            return $this->error(
                'Anda masih memiliki penyewaan aktif.',
                422
            );
        }

        $totalPrice = $totalDays * (float) $vehicle->daily_rate;

        $rental = DB::transaction(function () use (
            $request,
            $validated,
            $vehicle,
            $start,
            $end,
            $totalDays,
            $totalPrice
        ) {
            return Rental::create([
                'user_id' => $request->user()->id,
                'vehicle_id' => $vehicle->id,
                'start_date' => $start,
                'end_date' => $end,
                'total_date' => $totalDays,
                'total_price' => $totalPrice,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'pickup_method' => $validated['pickup_method'],
                'delivery_address' => $validated['pickup_method'] === 'delivery'
                    ? trim((string) $validated['delivery_address'])
                    : null,
                'booking_code' => $this->generateBookingCode(),
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        $rental->load([
            'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
            'vehicle.type:id,code,name',
            'payments:id,rental_id,amount,payment_method,payment_status,payment_type,paid_at',
            'lateFines:id,rental_id,total_fine,status,calculation_type,late_hours,late_minutes',
            'damages:id,rental_id,vehicle_id,description,repair_cost,status',
        ]);

        $customerName = $request->user()->full_name ?? 'Customer';
        $vehicleName = $vehicle->name ?? 'kendaraan';

        $this->notifyAllAdmins(
            'Pengajuan Baru',
            $customerName . ' mengajukan sewa untuk ' . $vehicleName . '.',
            'rental_created',
            'rental',
            $rental->id
        );

        return $this->created($this->transformRental($rental));
    }

    private function hasConflict(
        int $vehicleId,
        Carbon $start,
        Carbon $end
    ): bool {
        return Rental::query()
            ->where('vehicle_id', $vehicleId)
            ->whereIn('status', [
                'pending',
                'approved',
                'ongoing',
                'overdue',
                'inspection',
                'waiting_payment',
                'repair_process',
            ])
            ->where(function ($q) use ($start, $end) {
     
                $q->where('start_date', '<', $end)
                    ->where('end_date', '>', $start);
            })
            ->exists();
    }

    private function generateBookingCode(): string
    {
        $prefix = 'RNT-' . now()->format('Ymd');
        $lastId = ((int) Rental::query()->max('id')) + 1;

        return $prefix . '-' . str_pad(
            (string) $lastId,
            4,
            '0',
            STR_PAD_LEFT
        );
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
                'daily_rate' => (float) $r->vehicle->daily_rate,
                'vehicle_type' => $r->vehicle->type ? [
                    'id' => $r->vehicle->type->id,
                    'code' => $r->vehicle->type->code,
                    'name' => $r->vehicle->type->name,
                ] : null,
            ] : null,

            'start_date' => optional($r->start_date)->toDateTimeString(),
            'end_date' => optional($r->end_date)->toDateTimeString(),
            'actual_pickup_at' => optional($r->actual_pickup_at)->toDateTimeString(),
            'actual_return_at' => optional($r->actual_return_at)->toDateTimeString(),
            'returned_at' => optional($r->returned_at)->toDateTimeString(),
            'inspected_at' => optional($r->inspected_at)->toDateTimeString(),

            'total_date' => (int) $r->total_date,
            'total_price' => (float) $r->total_price,

            'status' => $r->status,
            'payment_status' => $r->payment_status,
            'payment_deadline' => optional($r->payment_deadline)->toDateTimeString(),

            'has_late_fine' => (bool) $r->has_late_fine,
            'has_damage' => (bool) $r->has_damage,
            'total_extra_cost' => (float) ($r->total_extra_cost ?? 0),

            'late_fines' => $r->lateFines
                ? $r->lateFines->map(fn ($fine) => [
                    'id' => $fine->id,
                    'total_fine' => (float) $fine->total_fine,
                    'status' => $fine->status,
                    'calculation_type' => $fine->calculation_type ?? null,
                    'late_hours' => $fine->late_hours ?? null,
                    'late_minutes' => $fine->late_minutes ?? null,
                ])->values()
                : [],

            'damages' => $r->damages
                ? $r->damages->map(fn ($damage) => [
                    'id' => $damage->id,
                    'description' => $damage->description,
                    'repair_cost' => (float) $damage->repair_cost,
                    'status' => $damage->status,
                ])->values()
                : [],

            'pickup_method' => $r->pickup_method,
            'delivery_address' => $r->delivery_address,
            'notes' => $r->notes,

            'created_at' => optional($r->created_at)->toDateTimeString(),
            'updated_at' => optional($r->updated_at)->toDateTimeString(),
        ];
    }
}