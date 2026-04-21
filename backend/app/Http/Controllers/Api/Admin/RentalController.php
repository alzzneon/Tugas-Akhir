<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ResourceController;
use App\Models\Payment;
use App\Models\Rental;
use App\Models\User;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RentalController extends ResourceController
{
    public function usersForRental()
    {
        $rows = User::query()
            ->select('id', 'full_name', 'email', 'phone_number', 'role')
            ->whereRaw('LOWER(role) = ?', ['customer'])
            ->orderBy('full_name')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'role' => $user->role,
                ];
            });

        return $this->success($rows);
    }

    public function index(Request $request)
    {
        $query = Rental::query()
            ->with([
                'user:id,full_name,email,phone_number',
                'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
                'vehicle.type:id,code,name',
                'approvedBy:id,full_name',
                'rejectedBy:id,full_name',
                'payments:id,rental_id,amount,payment_method,payment_status,payment_type,paid_at',
            ])
            ->latest('id');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->string('payment_status')->toString());
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('vehicle_id')) {
            $query->where('vehicle_id', (int) $request->input('vehicle_id'));
        }

        $rows = $query->get()->map(fn (Rental $r) => $this->transformRental($r));

        return $this->success($rows);
    }

    public function show(int $id)
    {
        $rental = Rental::query()
            ->with([
                'user:id,full_name,email,phone_number',
                'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
                'vehicle.type:id,code,name,late_fee_per_hour,late_fee_threshold_hours',
                'approvedBy:id,full_name',
                'rejectedBy:id,full_name',
                'payments',
                'lateFines',
            ])
            ->findOrFail($id);

        return $this->success($this->transformRental($rental));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['nullable', 'uuid', 'exists:users,id'],
            'vehicle_id' => ['required', 'integer', 'exists:mt_vehicles,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'pickup_method' => ['required', 'in:pickup,delivery'],
            'delivery_address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'direct_approve' => ['nullable', 'boolean'],
            'payment_deadline_hours' => ['nullable', 'integer', 'min:1'],

            'customer_name' => ['nullable', 'string', 'max:120'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'customer_email' => ['nullable', 'email', 'max:120'],
        ]);

        $hasRegisteredUser = !empty($validated['user_id']);
        $hasManualCustomer = !empty($validated['customer_name']) && !empty($validated['customer_phone']);

        if (!$hasRegisteredUser && !$hasManualCustomer) {
            return $this->error('Pilih user terdaftar atau isi data penyewa manual.', 422);
        }

        if (
            $validated['pickup_method'] === 'delivery' &&
            empty(trim((string) ($validated['delivery_address'] ?? '')))
        ) {
            return $this->error('Alamat pengantaran wajib diisi jika metode pengambilan adalah diantar.', 422);
        }

        if ($validated['pickup_method'] === 'pickup') {
            $validated['delivery_address'] = null;
        }

        $vehicle = Vehicle::query()
            ->with('type:id,code,name')
            ->where('is_active', true)
            ->findOrFail($validated['vehicle_id']);

        $start = Carbon::parse($validated['start_date'])->startOfDay();
        $end = Carbon::parse($validated['end_date'])->endOfDay();

        if ($this->hasConflict($vehicle->id, $start, $end)) {
            return $this->error('Jadwal kendaraan bentrok dengan rental lain.', 422);
        }

        $totalDays = $start->copy()->startOfDay()->diffInDays($end->copy()->startOfDay()) + 1;
        $totalPrice = $totalDays * (float) $vehicle->daily_rate;
        $directApprove = (bool) ($validated['direct_approve'] ?? true);
        $initialRentalStatus = $directApprove ? 'approved' : 'pending';

        $rental = DB::transaction(function () use (
            $validated,
            $vehicle,
            $start,
            $end,
            $totalDays,
            $totalPrice,
            $directApprove,
            $request,
            $hasRegisteredUser
        ) {
            return Rental::create([
                'user_id' => $validated['user_id'] ?? null,
                'vehicle_id' => $vehicle->id,
                'start_date' => $start,
                'end_date' => $end,
                'total_date' => $totalDays,
                'total_price' => $totalPrice,
                'status' => $directApprove ? 'approved' : 'pending',
                'payment_status' => 'unpaid',
                'payment_deadline' => $directApprove
                    ? now()->addHours((int) ($validated['payment_deadline_hours'] ?? 2))
                    : null,
                'approved_at' => $directApprove ? now() : null,
                'approved_by' => $directApprove ? optional($request->user())->id : null,
                'rejected_at' => null,
                'rejected_by' => null,
                'rejection_reason' => null,
                'booking_code' => $this->generateBookingCode(),
                'customer_name' => $validated['customer_name'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'customer_email' => $validated['customer_email'] ?? null,
                'pickup_method' => $validated['pickup_method'],
                'delivery_address' => $validated['pickup_method'] === 'delivery'
                    ? trim((string) $validated['delivery_address'])
                    : null,
                'notes' => $this->buildNotes(
                    $validated['notes'] ?? null,
                    $hasRegisteredUser ? null : [
                        'customer_name' => $validated['customer_name'] ?? null,
                        'customer_phone' => $validated['customer_phone'] ?? null,
                        'customer_email' => $validated['customer_email'] ?? null,
                    ]
                ),
            ]);
        });

        $rental->load([
            'user:id,full_name,email,phone_number',
            'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
            'vehicle.type:id,code,name',
            'approvedBy:id,full_name',
            'rejectedBy:id,full_name',
            'payments:id,rental_id,amount,payment_method,payment_status,payment_type,paid_at',
        ]);

        return $this->created($this->transformRental($rental));
    }

    public function approve(Request $request, int $id)
    {
        $validated = $request->validate([
            'payment_deadline_hours' => ['nullable', 'integer', 'min:1'],
        ]);

        $rental = Rental::query()->findOrFail($id);

        if (!in_array($rental->status, ['pending'], true)) {
            return $this->error('Rental tidak bisa di-approve dari status saat ini.', 422);
        }

        $rental->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => optional($request->user())->id,
            'payment_deadline' => now()->addHours((int) ($validated['payment_deadline_hours'] ?? 2)),
            'rejected_at' => null,
            'rejected_by' => null,
            'rejection_reason' => null,
        ]);

        $rental->load([
            'user:id,full_name,email,phone_number',
            'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
            'vehicle.type:id,code,name',
            'approvedBy:id,full_name',
            'rejectedBy:id,full_name',
        ]);

        return $this->success($this->transformRental($rental), 'Rental berhasil di-approve.');
    }

    public function reject(Request $request, int $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $rental = Rental::query()->findOrFail($id);

        if (!in_array($rental->status, ['pending', 'approved'], true)) {
            return $this->error('Rental tidak bisa ditolak dari status saat ini.', 422);
        }

        $rental->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'rejected_by' => optional($request->user())->id,
            'rejection_reason' => $validated['reason'],
            'payment_deadline' => null,
        ]);

        $rental->load([
            'user:id,full_name,email,phone_number',
            'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
            'vehicle.type:id,code,name',
            'approvedBy:id,full_name',
            'rejectedBy:id,full_name',
        ]);

        return $this->success($this->transformRental($rental), 'Rental berhasil ditolak.');
    }

    public function markOngoing(int $id)
    {
        $rental = Rental::query()->findOrFail($id);

        if ($rental->status !== 'paid') {
            return $this->error('Rental belum siap dijalankan. Pembayaran harus lunas terlebih dahulu.', 422);
        }

        $rental->update([
            'status' => 'ongoing',
            'actual_pickup_at' => $rental->actual_pickup_at ?: now(),
        ]);

        $rental->load([
            'user:id,full_name,email,phone_number',
            'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
            'vehicle.type:id,code,name',
            'approvedBy:id,full_name',
            'rejectedBy:id,full_name',
            'payments:id,rental_id,amount,payment_method,payment_status,payment_type,paid_at',
        ]);

        return $this->success($this->transformRental($rental), 'Rental mulai berjalan.');
    }

    public function complete(Request $request, int $id)
    {
        $validated = $request->validate([
            'actual_return_at' => ['nullable', 'date'],
        ]);

        $rental = Rental::query()
            ->with([
                'user:id,full_name,email,phone_number',
                'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
                'vehicle.type:id,code,name,late_fee_per_hour,late_fee_threshold_hours',
                'approvedBy:id,full_name',
                'rejectedBy:id,full_name',
                'payments:id,rental_id,amount,payment_method,payment_status,payment_type,paid_at',
                'lateFines',
            ])
            ->findOrFail($id);

        if (!in_array($rental->status, ['ongoing', 'overdue'], true)) {
            return $this->error('Rental tidak bisa diselesaikan dari status saat ini.', 422);
        }

        $actualReturn = isset($validated['actual_return_at'])
            ? Carbon::parse($validated['actual_return_at'])
            : now();

        $rental->update([
            'status' => 'completed',
            'actual_return_at' => $actualReturn,
        ]);

        $rental->refresh()->load([
            'user:id,full_name,email,phone_number',
            'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
            'vehicle.type:id,code,name,late_fee_per_hour,late_fee_threshold_hours',
            'approvedBy:id,full_name',
            'rejectedBy:id,full_name',
            'payments:id,rental_id,amount,payment_method,payment_status,payment_type,paid_at',
            'lateFines',
        ]);

        return $this->success(
            $this->transformRental($rental),
            'Rental selesai.'
        );
    }

    public function updateStatusPayment(Request $request, int $id)
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'max:50'],
            'payment_status' => ['required', 'string', 'max:50'],
            'payment_type' => ['nullable', 'string', 'max:20'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $rental = Rental::query()->findOrFail($id);

        DB::transaction(function () use ($validated, $rental) {
            $amount = (float) ($validated['amount'] ?? 0);
            $requestedStatus = strtolower((string) $validated['status']);
            $requestedPaymentStatus = strtolower((string) $validated['payment_status']);

            if ($amount > 0) {
                Payment::create([
                    'rental_id' => $rental->id,
                    'amount' => $amount,
                    'payment_method' => $validated['payment_method'] ?? 'transfer',
                    'payment_status' => 'paid',
                    'payment_type' => $validated['payment_type'] ?? 'full',
                    'provider' => 'manual',
                    'provider_reference' => 'MANUAL-' . now()->format('YmdHis') . '-' . $rental->id,
                    'notes' => $validated['notes'] ?? null,
                    'paid_at' => now(),
                ]);
            }

            $finalPaymentStatus = in_array($requestedPaymentStatus, ['unpaid', 'paid'], true)
                ? $requestedPaymentStatus
                : 'unpaid';

            $finalStatus = $requestedStatus;
            if ($finalPaymentStatus === 'paid' && in_array($requestedStatus, ['approved', 'pending'], true)) {
                $finalStatus = 'paid';
            }

            $actualReturnAt = $requestedStatus === 'completed' && empty($rental->actual_return_at)
                ? now()
                : $rental->actual_return_at;

            $actualPickupAt = $requestedStatus === 'ongoing' && empty($rental->actual_pickup_at)
                ? now()
                : $rental->actual_pickup_at;

            $rental->update([
                'status' => $finalStatus,
                'payment_status' => $finalPaymentStatus,
                'actual_pickup_at' => $actualPickupAt,
                'actual_return_at' => $actualReturnAt,
            ]);
        });

        $rental->load([
            'user:id,full_name,email,phone_number',
            'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
            'vehicle.type:id,code,name',
            'approvedBy:id,full_name',
            'rejectedBy:id,full_name',
            'payments:id,rental_id,amount,payment_method,payment_status,payment_type,paid_at',
        ]);

        return $this->success(
            $this->transformRental($rental),
            'Status rental dan pembayaran berhasil diperbarui.'
        );
    }

    private function hasConflict(int $vehicleId, Carbon $start, Carbon $end, ?int $ignoreRentalId = null): bool
    {
        return Rental::query()
            ->where('vehicle_id', $vehicleId)
            ->whereIn('status', [
                'pending',
                'approved',
                'paid',
                'ongoing',
                'overdue',
            ])
            ->when($ignoreRentalId, fn ($q) => $q->where('id', '!=', $ignoreRentalId))
            ->where(function ($q) use ($start, $end) {
                $q->where('start_date', '<=', $end)
                  ->where('end_date', '>=', $start);
            })
            ->exists();
    }

    private function generateBookingCode(): string
    {
        $prefix = 'RNT-' . now()->format('Ymd');
        $lastId = ((int) Rental::query()->max('id')) + 1;

        return $prefix . '-' . str_pad((string) $lastId, 4, '0', STR_PAD_LEFT);
    }

    private function buildNotes(?string $notes, ?array $manualCustomer = null): ?string
    {
        $parts = [];

        if (!empty($notes)) {
            $parts[] = trim($notes);
        }

        if (!empty($manualCustomer)) {
            $parts[] = '[MANUAL_CUSTOMER]';
            $parts[] = 'Nama: ' . ($manualCustomer['customer_name'] ?? '-');
            $parts[] = 'Telepon: ' . ($manualCustomer['customer_phone'] ?? '-');
            $parts[] = 'Email: ' . ($manualCustomer['customer_email'] ?? '-');
        }

        if (empty($parts)) {
            return null;
        }

        return implode("\n", $parts);
    }

    private function extractManualCustomer(?string $notes): ?array
    {
        if (empty($notes) || !str_contains($notes, '[MANUAL_CUSTOMER]')) {
            return null;
        }

        $result = [
            'customer_name' => null,
            'customer_phone' => null,
            'customer_email' => null,
        ];

        $lines = preg_split('/\r\n|\r|\n/', $notes);

        foreach ($lines as $line) {
            $line = trim($line);

            if (str_starts_with($line, 'Nama: ')) {
                $result['customer_name'] = trim(substr($line, 6));
            } elseif (str_starts_with($line, 'Telepon: ')) {
                $result['customer_phone'] = trim(substr($line, 9));
            } elseif (str_starts_with($line, 'Email: ')) {
                $result['customer_email'] = trim(substr($line, 7));
            }
        }

        return $result;
    }

    private function transformRental(Rental $r): array
    {
        $manualFromNotes = $this->extractManualCustomer($r->notes);

        $manualCustomer = null;

        if (!$r->user_id) {
            $manualCustomer = [
                'customer_name' => $r->customer_name ?? ($manualFromNotes['customer_name'] ?? null),
                'customer_phone' => $r->customer_phone ?? ($manualFromNotes['customer_phone'] ?? null),
                'customer_email' => $r->customer_email ?? ($manualFromNotes['customer_email'] ?? null),
            ];
        }

        return [
            'id' => $r->id,
            'booking_code' => $r->booking_code,

            'user' => $r->user ? [
                'id' => $r->user->id,
                'full_name' => $r->user->full_name,
                'email' => $r->user->email,
                'phone_number' => $r->user->phone_number,
            ] : null,

            'manual_customer' => $manualCustomer,

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
            'actual_pickup_at' => optional($r->actual_pickup_at)->toDateTimeString(),
            'actual_return_at' => optional($r->actual_return_at)->toDateTimeString(),

            'total_date' => $r->total_date,
            'total_price' => $r->total_price,
            'status' => $r->status,
            'payment_status' => $r->payment_status,
            'payment_deadline' => optional($r->payment_deadline)->toDateTimeString(),
            'pickup_method' => $r->pickup_method,
            'delivery_address' => $r->delivery_address,

            'approved_at' => optional($r->approved_at)->toDateTimeString(),
            'approved_by' => $r->approvedBy?->full_name,

            'rejected_at' => optional($r->rejected_at)->toDateTimeString(),
            'rejected_by' => $r->rejectedBy?->full_name,
            'rejection_reason' => $r->rejection_reason,

            'notes' => $r->notes,
            'created_at' => optional($r->created_at)->toDateTimeString(),
            'updated_at' => optional($r->updated_at)->toDateTimeString(),
        ];
    }
}