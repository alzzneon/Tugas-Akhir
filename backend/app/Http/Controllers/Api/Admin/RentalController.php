<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Concerns\CreatesNotifications;
use App\Http\Controllers\Api\ResourceController;
use App\Models\Payment;
use App\Models\Rental;
use Illuminate\Support\Facades\Http;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\FonnteService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;



class RentalController extends ResourceController
{
    use CreatesNotifications;

    protected FonnteService $fonnteService;

    public function __construct(FonnteService $fonnteService)
    {
        $this->fonnteService = $fonnteService;
    }

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
                'user:id,full_name,email,phone_number,address',
                'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
                'vehicle.type:id,code,name',
                'approvedBy:id,full_name',
                'rejectedBy:id,full_name',
                'payments:id,rental_id,amount,payment_method,payment_status,payment_type,paid_at',
                'lateFines:id,rental_id,total_fine,status,calculation_type,late_hours,late_minutes',
                'damages:id,rental_id,vehicle_id,description,repair_cost,status',
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
                'user:id,full_name,email,phone_number,address',
                'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
                'vehicle.type:id,code,name',
                'approvedBy:id,full_name',
                'rejectedBy:id,full_name',
                'payments',
                'lateFines',
                'damages:id,rental_id,vehicle_id,description,repair_cost,status',
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

        $rental = DB::transaction(function () use (
            $validated,
            $vehicle,
            $start,
            $end,
            $totalDays,
            $totalPrice,
            $directApprove,
            $request
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
                    !$validated['user_id'] ? [
                        'customer_name' => $validated['customer_name'] ?? null,
                        'customer_phone' => $validated['customer_phone'] ?? null,
                        'customer_email' => $validated['customer_email'] ?? null,
                    ] : null
                ),
            ]);
        });

        $rental->load([
            'user:id,full_name,email,phone_number,address',
            'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
            'vehicle.type:id,code,name',
            'approvedBy:id,full_name',
            'rejectedBy:id,full_name',
            'payments:id,rental_id,amount,payment_method,payment_status,payment_type,paid_at',
        ]);

        if (!empty($rental->user_id)) {
            if ($rental->status === 'approved') {
                $this->createNotification(
                    $rental->user_id,
                    'Penyewaan Disetujui',
                    'Pesanan Anda telah disetujui. Silakan lakukan pembayaran.',
                    'rental_approved',
                    'rental',
                    $rental->id
                );

                $this->sendApprovalWhatsapp($rental);
            } else {
                $this->createNotification(
                    $rental->user_id,
                    'Penyewaan Dibuat Admin',
                    'Admin telah membuat penyewaan untuk akun Anda.',
                    'rental_created_by_admin',
                    'rental',
                    $rental->id
                );
            }
        }

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
            'user:id,full_name,email,phone_number,address',
            'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
            'vehicle.type:id,code,name',
            'approvedBy:id,full_name',
            'rejectedBy:id,full_name',
        ]);

        if (!empty($rental->user_id)) {
            $this->createNotification(
                $rental->user_id,
                'Penyewaan Disetujui',
                'Pesanan Anda telah disetujui. Silakan lakukan pembayaran.',
                'rental_approved',
                'rental',
                $rental->id
            );

            $this->sendApprovalWhatsapp($rental);
        }

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
            'user:id,full_name,email,phone_number,address',
            'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
            'vehicle.type:id,code,name',
            'approvedBy:id,full_name',
            'rejectedBy:id,full_name',
        ]);

        if (!empty($rental->user_id)) {
            $this->createNotification(
                $rental->user_id,
                'Penyewaan Ditolak',
                'Pesanan Anda ditolak oleh admin.',
                'rental_rejected',
                'rental',
                $rental->id
            );

            $this->sendRejectedWhatsapp($rental, $validated['reason']);
        }

        return $this->success($this->transformRental($rental), 'Rental berhasil ditolak.');
    }

    public function markOngoing(int $id)
    {
        $rental = Rental::findOrFail($id);

        if ($rental->status !== 'approved') {
            return $this->error(
                'Rental harus berstatus approved.',
                422
            );
        }

        if ($rental->payment_status !== 'paid') {
            return $this->error(
                'Rental belum dibayar.',
                422
            );
        }

        $rental->update([
            'status' => 'ongoing',
            'actual_pickup_at' => now(),
        ]);

        return $this->success(
            $this->transformRental(
                $rental->fresh([
                    'user',
                    'vehicle.type',
                    'approvedBy',
                    'rejectedBy',
                    'payments',
                ])
            ),
            'Rental mulai berjalan.'
        );
    }

    public function markReturned(Request $request, Rental $rental)
    {
        if (!in_array($rental->status, [
            'ongoing',
            'overdue',
        ], true)) {

            return $this->error(
                'Rental belum bisa dikembalikan.',
                422
            );
        }

        $request->validate([
            'actual_return_at' => ['nullable', 'date'],
        ]);

        $actualReturn = Carbon::parse(
            $request->actual_return_at ?? now()
        );

        $rental->load([
            'vehicle.type',
            'user',
        ]);

        $lateHours = 0;
        $totalFine = 0;
        $calculationType = null;

        if ($actualReturn->greaterThan($rental->end_date)) {

            $lateHours = $rental->end_date
                ->diffInHours($actualReturn);

            $threshold =
                (int) $rental->vehicle->type->late_fee_threshold_hours;

            if ($lateHours <= $threshold) {

                $totalFine =
                    $lateHours *
                    (float) $rental->vehicle->type->late_fee_per_hour;

                $calculationType = 'hourly';

            } else {

                $additionalDays = ceil(
                    $lateHours / 24
                );

                $totalFine =
                    $additionalDays *
                    (float) $rental->vehicle->daily_rate;

                $calculationType = 'additional_rental_day';
            }
        }

        DB::transaction(function () use (
            $rental,
            $actualReturn,
            $totalFine,
            $lateHours,
            $calculationType
        ) {

            $rental->update([
                'status' => 'returned',
                'actual_return_at' => $actualReturn,
            ]);

            if ($totalFine > 0) {

                $rental->lateFines()->create([
                    'total_fine' => $totalFine,
                    'status' => 'unpaid',
                    'calculation_type' => $calculationType,
                    'late_hours' => $lateHours,
                ]);
            }
        });

        if ($totalFine > 0) {

            $this->sendLateFineWhatsapp(
                $rental->fresh(['vehicle']),
                $totalFine
            );
        }

        return $this->success(
            $rental->fresh(),
            'Kendaraan berhasil dikembalikan.'
        );
    }

    public function updateStatusPayment(Request $request, int $id)
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'payment_status' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string'],
            'payment_type' => ['nullable', 'string'],
            'amount' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
        ]);

        $rental = Rental::findOrFail($id);

        $current = $rental->status;
        $next = $validated['status'] ?? $current;

        if (!$current) {
            return response()->json([
                'message' => 'Status rental tidak ditemukan.'
            ], 422);
        }

        if (
            $next !== $current &&
            !$this->canTransitionStatus($current, $next)
        ) {
            return response()->json([
                'message' => 'Perubahan status tidak valid.'
            ], 422);
        }

        DB::transaction(function () use (
            $validated,
            $rental,
            $next
        ) {
            $rental->update([
                'status' => $next,
                'payment_status' =>
                    $validated['payment_status']
                    ?? $rental->payment_status,

                'notes' =>
                    $validated['notes']
                    ?? $rental->notes,
            ]);

            if (
                !empty($validated['amount']) &&
                $validated['amount'] > 0
            ) {
                $rental->payments()->create([
                    'amount' =>
                        $validated['amount'],

                    'payment_method' =>
                        $validated['payment_method']
                        ?? 'cash',

                    'payment_type' =>
                        $validated['payment_type']
                        ?? 'full',

                    'payment_status' => match ($validated['payment_status'] ?? 'paid') {
                        'paid' => 'settlement',
                        'refund' => 'refund',
                        'expired' => 'expire',
                        'failed' => 'deny',
                        default => 'settlement',
                    },
                    'paid_at' => now(),
                ]);
            }
        });

        return response()->json([
            'message' => 'Rental berhasil diperbarui.'
        ]);
    }

    public function refund(int $id)
    {
        try {

            Log::info('REFUND START', [
                'rental_id' => $id
            ]);

            $rental = Rental::findOrFail($id);

            Log::info('RENTAL FOUND', [
                'id' => $rental->id,
                'status' => $rental->status,
                'payment_status' => $rental->payment_status,
            ]);

            // hanya boleh refund jika sudah dibayar
            if ($rental->payment_status !== 'paid') {

                Log::warning('REFUND FAILED - PAYMENT NOT PAID', [
                    'rental_id' => $rental->id,
                    'payment_status' => $rental->payment_status,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Rental belum dibayar.'
                ], 422);
            }

            // hanya boleh refund sebelum kendaraan diserahkan
            if ($rental->status !== 'approved') {

                Log::warning('REFUND FAILED - INVALID STATUS', [
                    'rental_id' => $rental->id,
                    'status' => $rental->status,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Refund hanya bisa dilakukan sebelum kendaraan diserahkan.'
                ], 422);
            }

            $payment = Payment::where(
                'rental_id',
                $rental->id
            )
            ->latest()
            ->first();

            if (!$payment) {

                Log::warning('REFUND FAILED - PAYMENT NOT FOUND', [
                    'rental_id' => $rental->id
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Data pembayaran tidak ditemukan.'
                ], 404);
            }

            Log::info('PAYMENT FOUND', [
                'payment_id' => $payment->id,
                'payment_status' => $payment->payment_status,
                'amount' => $payment->amount,
                'order_id' => $payment->order_id,
            ]);

            /*
            |--------------------------------------------------------------------------
            | SANDBOX MODE
            |--------------------------------------------------------------------------
            */
            if (!config('midtrans.is_production')) {

                Log::info('REFUND SANDBOX MODE');

                DB::transaction(function () use (
                    $payment,
                    $rental
                ) {

                    Log::info('UPDATING PAYMENT', [
                        'payment_id' => $payment->id
                    ]);

                    $payment->update([
                        'payment_status' => 'refund',
                        'notes' => 'Refund Sandbox'
                    ]);

                    Log::info('UPDATING RENTAL', [
                        'rental_id' => $rental->id
                    ]);

                    $rental->update([
                        'payment_status' => 'refunded',
                        'status' => 'cancelled'
                    ]);
                });

                Log::info('REFUND SANDBOX SUCCESS', [
                    'rental_id' => $rental->id
                ]);

                if ($rental->user_id) {

                    $this->createNotification(
                        $rental->user_id,
                        'Refund Berhasil',
                        'Dana pembayaran rental telah direfund dan pesanan dibatalkan.',
                        'payment_refund',
                        'rental',
                        $rental->id
                    );
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Refund Sandbox berhasil diproses'
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | PRODUCTION MODE
            |--------------------------------------------------------------------------
            */

            $payment = Payment::where(
                'rental_id',
                $rental->id
            )
            ->whereIn('payment_status', [
                'settlement',
                'capture'
            ])
            ->latest()
            ->first();

            if (!$payment) {

                Log::warning('MIDTRANS PAYMENT NOT FOUND', [
                    'rental_id' => $rental->id
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Transaksi Midtrans tidak ditemukan.'
                ], 404);
            }

            $baseUrl = config('midtrans.is_production')
                ? 'https://api.midtrans.com'
                : 'https://api.sandbox.midtrans.com';

            Log::info('CALL MIDTRANS REFUND', [
                'order_id' => $payment->order_id,
                'base_url' => $baseUrl
            ]);

            $response = Http::withBasicAuth(
                config('midtrans.server_key'),
                ''
            )->post(
                "{$baseUrl}/v2/{$payment->order_id}/refund",
                [
                    'refund_key' => 'RF-' . now()->timestamp,
                    'amount' => (int) $payment->amount,
                    'reason' => 'Pembatalan rental'
                ]
            );

            $data = $response->json();

            Log::info('MIDTRANS RESPONSE', [
                'http_status' => $response->status(),
                'response' => $data
            ]);

            if (
                !$response->successful() ||
                !isset($data['status_code']) ||
                !in_array(
                    (string) $data['status_code'],
                    ['200', '201']
                )
            ) {

                Log::error('MIDTRANS REFUND FAILED', [
                    'response' => $data
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Refund gagal',
                    'midtrans_response' => $data,
                ], 422);
            }

            DB::transaction(function () use (
                $payment,
                $rental
            ) {

                $payment->update([
                    'payment_status' => 'refund',
                    'notes' => 'Refund Midtrans'
                ]);

                $rental->update([
                    'payment_status' => 'refunded',
                    'status' => 'cancelled'
                ]);
            });

            Log::info('REFUND SUCCESS', [
                'rental_id' => $rental->id
            ]);

            if ($rental->user_id) {

                $this->createNotification(
                    $rental->user_id,
                    'Refund Berhasil',
                    'Dana pembayaran rental telah direfund dan pesanan dibatalkan.',
                    'payment_refund',
                    'rental',
                    $rental->id
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Refund berhasil diproses',
                'midtrans_response' => $data,
            ]);

        } catch (\Throwable $e) {

            Log::error('REFUND EXCEPTION', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    private function sendApprovalWhatsapp(Rental $rental): void
    {
        $phone = $this->resolveWhatsappPhone($rental);

        if (!$phone) {
            return;
        }

        $customerName = $rental->user?->full_name ?: $rental->customer_name ?: 'Customer';

        $message =
            "Halo {$customerName},\n\n" .
            "Pesanan Anda telah disetujui.\n" .
            "Kode Booking: {$rental->booking_code}\n" .
            "Kendaraan: " . ($rental->vehicle->name ?? '-') . "\n" .
            "Tanggal Sewa: " .
            optional($rental->start_date)->format('d/m/Y') . " - " .
            optional($rental->end_date)->format('d/m/Y') . "\n" .
            "Total: Rp " . number_format((float) $rental->total_price, 0, ',', '.') . "\n\n" .
            "Silakan lanjutkan proses pembayaran.\n" .
            "Terima kasih.";

        try {
            $response = $this->fonnteService->sendMessage($phone, $message);

            $this->logWhatsappMessage(
                $rental->id,
                $rental->user_id,
                $phone,
                $message,
                'sent',
                'approval',
                isset($response['id']) ? (string) $response['id'] : null,
                null
            );
        } catch (\Throwable $e) {
            Log::error('Gagal kirim WhatsApp approval', [
                'rental_id' => $rental->id,
                'user_id' => $rental->user_id,
                'phone_number' => $phone,
                'error' => $e->getMessage(),
            ]);

            $this->logWhatsappMessage(
                $rental->id,
                $rental->user_id,
                $phone,
                $message,
                'failed',
                'approval',
                null,
                $e->getMessage()
            );
        }
    }

    private function sendRejectedWhatsapp(Rental $rental, string $reason): void
    {
        $phone = $this->resolveWhatsappPhone($rental);

        if (!$phone) {
            return;
        }

        $customerName = $rental->user?->full_name ?: $rental->customer_name ?: 'Customer';

        $message =
            "Halo {$customerName},\n\n" .
            "Mohon maaf, pesanan Anda ditolak.\n" .
            "Kode Booking: {$rental->booking_code}\n" .
            "Kendaraan: " . ($rental->vehicle->name ?? '-') . "\n" .
            "Alasan: {$reason}\n\n" .
            "Silakan lakukan pemesanan ulang dengan jadwal atau kendaraan lain.\n" .
            "Terima kasih.";

        try {
            $response = $this->fonnteService->sendMessage($phone, $message);

            $this->logWhatsappMessage(
                $rental->id,
                $rental->user_id,
                $phone,
                $message,
                'sent',
                'rejection',
                isset($response['id']) ? (string) $response['id'] : null,
                null
            );
        } catch (\Throwable $e) {
            Log::error('Gagal kirim WhatsApp rejection', [
                'rental_id' => $rental->id,
                'user_id' => $rental->user_id,
                'phone_number' => $phone,
                'error' => $e->getMessage(),
            ]);

            $this->logWhatsappMessage(
                $rental->id,
                $rental->user_id,
                $phone,
                $message,
                'failed',
                'rejection',
                null,
                $e->getMessage()
            );
        }
    }

    private function sendLateFineWhatsapp(Rental $rental, float $totalFine): void 
    {

        $phone = $this->resolveWhatsappPhone($rental);

        if (!$phone) {
            return;
        }

        $customerName =
            $rental->user?->full_name
            ?: $rental->customer_name
            ?: 'Customer';

        $message =
            "Halo {$customerName},\n\n" .
            "Kendaraan telah berhasil dikembalikan.\n\n" .
            "Kode Booking: {$rental->booking_code}\n" .
            "Kendaraan: " . ($rental->vehicle->name ?? '-') . "\n\n" .
            "Terdapat biaya keterlambatan sebesar:\n" .
            "Rp " . number_format($totalFine, 0, ',', '.') . "\n\n" .
            "Silakan melakukan pembayaran melalui aplikasi.\n\n" .
            "Terima kasih.";

        try {

            $response = $this->fonnteService->sendMessage(
                $phone,
                $message
            );

            $this->logWhatsappMessage(
                $rental->id,
                $rental->user_id,
                $phone,
                $message,
                'sent',
                'late_fine',
                isset($response['id'])
                    ? (string) $response['id']
                    : null,
                null
            );

        } catch (\Throwable $e) {

            \Log::error(
                'Gagal kirim WA denda keterlambatan',
                [
                    'rental_id' => $rental->id,
                    'error' => $e->getMessage(),
                ]
            );

            $this->logWhatsappMessage(
                $rental->id,
                $rental->user_id,
                $phone,
                $message,
                'failed',
                'late_fine',
                null,
                $e->getMessage()
            );
        }
    }

    private function resolveWhatsappPhone(Rental $rental): ?string
    {
        $phone = $rental->user?->phone_number ?: $rental->customer_phone;

        if (!$phone) {
            return null;
        }

        return trim((string) $phone);
    }

    private function logWhatsappMessage(
        ?int $rentalId,
        ?string $userId,
        ?string $phoneNumber,
        string $message,
        string $status,
        ?string $messageType = 'notification',
        ?string $providerMessageId = null,
        ?string $errorMessage = null
    ): void {
        try {
            DB::table('whatsapp_messages')->insert([
                'user_id' => $userId,
                'phone_number' => $phoneNumber,
                'message_content' => $message,
                'status' => $status,
                'sent_at' => $status === 'sent' ? now() : null,
                'rental_id' => $rentalId,
                'message_type' => $messageType,
                'provider' => 'fonnte',
                'provider_message_id' => $providerMessageId,
                'updated_at' => now(),
                'error_message' => $errorMessage,
            ]);
        } catch (\Throwable $e) {
            Log::error('Gagal menyimpan log WhatsApp', [
                'rental_id' => $rentalId,
                'user_id' => $userId,
                'phone_number' => $phoneNumber,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function hasConflict(
    int $vehicleId,
    Carbon $start,
    Carbon $end,
    ?int $ignoreRentalId = null
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

        ->when(
            $ignoreRentalId,
            fn ($q) =>
                $q->where('id', '!=', $ignoreRentalId)
        )

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
            'address' => $r->user->address,
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
        'total_price' => (float) $r->total_price,
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

        'notes' => $r->notes,
        'created_at' => optional($r->created_at)->toDateTimeString(),
        'updated_at' => optional($r->updated_at)->toDateTimeString(),
    ];
}

public function inspectVehicle(Request $request, int $id)
{
    $validated = $request->validate([
        'has_late_fine' => ['required', 'boolean'],
        'late_fine_amount' => ['nullable', 'numeric', 'min:0'],

        'has_damage' => ['required', 'boolean'],

        'damages' => ['nullable', 'array'],
        'damages.*.description' => ['required', 'string', 'max:1000'],
        'damages.*.repair_cost' => ['required', 'numeric', 'min:0'],
    ]);

    $rental = Rental::findOrFail($id);

    if (!in_array($rental->status, [
        'returned',
        'inspection',
        'waiting_payment',
    ], true)) {
        return $this->error(
            'Rental belum bisa diinspeksi.',
            422
        );
    }

    DB::transaction(function () use ($validated, $rental) {
        /*
        |--------------------------------------------------------------------------
        | HAPUS DATA KERUSAKAN LAMA UNTUK RENTAL INI
        |--------------------------------------------------------------------------
        | Supaya ketika admin simpan ulang, data kerusakan tidak dobel.
        */

        $existingDamageIds = $rental->damages()
            ->pluck('id')
            ->all();

        if (!empty($existingDamageIds)) {
            DB::table('vehicle_services')
                ->whereIn('damage_id', $existingDamageIds)
                ->delete();
        }

        $rental->damages()->delete();

        /*
        |--------------------------------------------------------------------------
        | HITUNG TOTAL DENDA / BIAYA TAMBAHAN
        |--------------------------------------------------------------------------
        */

        $totalExtra = 0;

        $rental->lateFines()
            ->where('calculation_type', 'manual')
            ->where('status', 'unpaid')
            ->delete();

        $totalExtra += (float) $rental->lateFines()
            ->sum('total_fine');

        if ($validated['has_late_fine']) {
            $fineAmount = (float) ($validated['late_fine_amount'] ?? 0);

            if ($fineAmount > 0) {
                $rental->lateFines()->create([
                    'total_fine' => $fineAmount,
                    'status' => 'unpaid',
                    'calculation_type' => 'manual',
                    'late_hours' => 0,
                ]);

                $totalExtra += $fineAmount;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | SIMPAN KERUSAKAN
        |--------------------------------------------------------------------------
        */

        $damages = $validated['has_damage']
            ? ($validated['damages'] ?? [])
            : [];

        $maintenanceTypeId = DB::table('mt_maintenance_types')
            ->where('name', 'Perbaikan Kerusakan')
            ->value('id');

        foreach ($damages as $damage) {
            $repairCost = (float) $damage['repair_cost'];

            $damageRow = $rental->damages()->create([
                'vehicle_id' => $rental->vehicle_id,
                'description' => $damage['description'],
                'repair_cost' => $repairCost,
                'status' => 'pending',
            ]);

            DB::table('vehicle_services')->insert([
                'vehicle_id' => $rental->vehicle_id,
                'rental_id' => $rental->id,
                'damage_id' => $damageRow->id,
                'maintenance_type_id' => $maintenanceTypeId,
                'service_date' => now()->toDateString(),
                'service_type' => 'Perbaikan Kerusakan',
                'condition_status' => 'damaged',
                'description' => $damage['description'],
                'cost' => $repairCost,
                'status' => 'planned',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $totalExtra += $repairCost;
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS AKHIR RENTAL
        |--------------------------------------------------------------------------
        */

        $newStatus = $totalExtra > 0
            ? 'waiting_payment'
            : 'completed';

        $rental->update([
            'status' => $newStatus,
            'inspected_at' => now(),
            'has_late_fine' => (float) $rental->lateFines()->sum('total_fine') > 0,
            'has_damage' => count($damages) > 0,
            'total_extra_cost' => $totalExtra,
        ]);
    });

    return $this->success(
        $rental->fresh([
            'lateFines',
            'damages',
        ]),
        'Inspeksi kendaraan berhasil.'
    );
}

    public function pay(Request $request, int $id)
    {
        $validated = $request->validate([
            'payment_method' => ['required', 'string', 'max:50'],
            'payment_type' => ['nullable', 'string', 'max:20'],
            'amount' => ['required', 'numeric', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        $rental = Rental::query()
            ->with('user', 'vehicle')
            ->findOrFail($id);


        if ($rental->status !== 'approved') {
            return $this->error(
                'Rental hanya bisa dibayar jika status approved.',
                422
            );
        }

        if ($rental->payment_status === 'paid') {
            return $this->error(
                'Rental sudah dibayar.',
                422
            );
        }

        DB::transaction(function () use ($validated, $rental) {

            Payment::create([
                'rental_id' => $rental->id,
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'paid',
                'payment_type' => $validated['payment_type'] ?? 'full',
                'provider' => 'manual',
                'provider_reference' => 'USER-' . now()->format('YmdHis'),
                'notes' => $validated['notes'] ?? null,
                'paid_at' => now(),
            ]);

            $rental->update([
                'payment_status' => 'paid',
            ]);
        });


        if ($rental->user_id) {

            $this->createNotification(
                $rental->user_id,
                'Pembayaran Berhasil',
                'Pembayaran rental berhasil dilakukan.',
                'payment_paid',
                'rental',
                $rental->id
            );

            $this->sendPaymentWhatsapp($rental);
        }

        return $this->success(
            $rental->fresh(),
            'Pembayaran berhasil.'
        );
    }

    private function sendPaymentWhatsapp(Rental $rental): void
    {
        $phone = $this->resolveWhatsappPhone($rental);

        if (!$phone) {
            return;
        }

        $customerName = $rental->user?->full_name
            ?: $rental->customer_name
            ?: 'Customer';

        $message =
            "Halo {$customerName},\n\n" .
            "Pembayaran rental berhasil diterima.\n" .
            "Kode Booking: {$rental->booking_code}\n" .
            "Status: LUNAS\n\n" .
            "Terima kasih.";

        try {

            $this->fonnteService->sendMessage(
                $phone,
                $message
            );

        } catch (\Throwable $e) {

            Log::error('Gagal kirim WA pembayaran', [
                'rental_id' => $rental->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function payAdditionalCost(Request $request, int $id)
{
    $validated = $request->validate([
        'amount' => ['required', 'numeric', 'min:1'],
        'payment_method' => ['required', 'string'],
        'notes' => ['nullable', 'string'],
    ]);

    $rental = Rental::findOrFail($id);

    if ($rental->status !== 'waiting_payment') {

        return $this->error(
            'Rental tidak menunggu pembayaran tambahan.',
            422
        );
    }

    DB::transaction(function () use (
        $validated,
        $rental
    ) {

Payment::create([
    'rental_id' => $rental->id,
    'amount' => $validated['amount'],
    'payment_method' => $validated['payment_method'],
    'payment_status' => 'settlement',
    'payment_type' => 'extra',
    'provider' => 'manual',
    'provider_reference' => 'ADD-' . now()->format('YmdHis'),
    'notes' => $validated['notes'] ?? null,
    'paid_at' => now(),
]);
        $rental->update([
            'status' => 'completed',
        ]);
    });

    return $this->success(
        $rental->fresh(),
        'Pembayaran tambahan berhasil.'
    );
}

private function canTransitionStatus(
    string $current,
    string $next
): bool {

    $current = strtolower($current);

    $next = strtolower($next);

    $allowed = [

        'pending' => [
            'approved',
            'rejected',
            'cancelled',
        ],

        'approved' => [
            'ongoing',
            'cancelled',
        ],

        'ongoing' => [
            'returned',
            'overdue',
        ],

        'overdue' => [
            'returned',
        ],

        'returned' => [
            'inspection',
        ],

        'inspection' => [
            'waiting_payment',
            'completed',
        ],

        'waiting_payment' => [
            'repair_process',
            'completed',
        ],

        'repair_process' => [
            'completed',
        ],

        'completed' => [],

        'rejected' => [],

        'cancelled' => [],
    ];

    return in_array(
        $next,
        $allowed[$current] ?? [],
        true
    );
}

}