<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Concerns\CreatesNotifications;
use App\Http\Controllers\Api\ResourceController;
use App\Models\Payment;
use App\Models\Rental;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\FonnteService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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

        $rows = $query
            ->get()
            ->map(fn (Rental $r) => $this->transformRental($r));

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
        return $this->error(
            'Pembuatan rental hanya dapat dilakukan oleh customer melalui sistem.',
            403
        );
    }

    public function approve(Request $request, int $id)
    {
        $validated = $request->validate([
            'payment_deadline_hours' => ['nullable', 'integer', 'min:1'],
        ]);

        $rental = Rental::query()->findOrFail($id);

        if (!in_array($rental->status, ['pending'], true)) {
            return $this->error(
                'Rental tidak bisa di-approve dari status saat ini.',
                422
            );
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

        return $this->success(
            $this->transformRental($rental),
            'Rental berhasil di-approve.'
        );
    }

    public function reject(Request $request, int $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $rental = Rental::query()->findOrFail($id);

        if (!in_array($rental->status, ['pending', 'approved'], true)) {
            return $this->error(
                'Rental tidak bisa ditolak dari status saat ini.',
                422
            );
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

        return $this->success(
            $this->transformRental($rental),
            'Rental berhasil ditolak.'
        );
    }

    public function markOngoing(int $id)
    {
        $rental = Rental::query()
            ->with([
                'user',
                'vehicle.type',
            ])
            ->findOrFail($id);

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

        $this->sendRentalStartedWhatsapp(
            $rental->fresh([
                'user',
                'vehicle.type',
            ])
        );

        return $this->success(
            $this->transformRental(
                $rental->fresh([
                    'user',
                    'vehicle.type',
                    'approvedBy',
                    'rejectedBy',
                    'payments',
                    'lateFines',
                    'damages',
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

    $lateMinutes = 0;
    $lateHours = 0;
    $totalFine = 0;
    $calculationType = null;

    if ($actualReturn->greaterThan($rental->end_date)) {
        $lateMinutes = $rental->end_date
            ->diffInMinutes($actualReturn);

        $lateHours = (int) ceil($lateMinutes / 60);

        $threshold = (int) (
            $rental->vehicle?->type?->late_fee_threshold_hours ?? 0
        );

        $lateFeePerHour = (float) (
            $rental->vehicle?->type?->late_fee_per_hour ?? 0
        );

        if ($lateHours <= $threshold) {
            $totalFine = $lateHours * $lateFeePerHour;
            $calculationType = 'hourly';
        } else {
            $additionalDays = (int) ceil($lateHours / 24);

            $totalFine = $additionalDays * (float) $rental->vehicle->daily_rate;
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
            'has_late_fine' => $totalFine > 0,
            'total_extra_cost' => $totalFine > 0
                ? $totalFine
                : (float) ($rental->total_extra_cost ?? 0),
        ]);

        /*
        |--------------------------------------------------------------------------
        | Hapus denda otomatis lama yang belum dibayar
        |--------------------------------------------------------------------------
        | Supaya kalau admin klik simpan ulang, denda tidak dobel.
        |--------------------------------------------------------------------------
        */

        $rental->lateFines()
            ->whereIn('calculation_type', [
                'hourly',
                'additional_rental_day',
            ])
            ->where('status', 'unpaid')
            ->delete();

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
            $rental->fresh([
                'user',
                'vehicle',
            ]),
            $totalFine
        );
    }

    return $this->success(
        $this->transformRental(
            $rental->fresh([
                'user',
                'vehicle.type',
                'approvedBy',
                'rejectedBy',
                'payments',
                'lateFines',
                'damages',
            ])
        ),
        'Kendaraan berhasil dikembalikan.'
    );
}

    public function updateStatusPayment(Request $request, int $id)
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],

            // Field lama tetap diterima agar frontend lama tidak langsung error.
            // Namun field pembayaran tidak dipakai untuk update database.
            'payment_status' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string'],
            'payment_type' => ['nullable', 'string'],
            'amount' => ['nullable', 'numeric'],
        ]);

        $rental = Rental::findOrFail($id);

        $current = $rental->status;
        $next = $validated['status'] ?? $current;

        if (!$current) {
            return response()->json([
                'message' => 'Status rental tidak ditemukan.',
            ], 422);
        }

        if (
            $next !== $current &&
            !$this->canTransitionStatus($current, $next)
        ) {
            return response()->json([
                'message' => 'Perubahan status tidak valid.',
            ], 422);
        }

        DB::transaction(function () use (
            $validated,
            $rental,
            $next
        ) {
            $updateData = [
                'status' => $next,
            ];

            if (array_key_exists('notes', $validated)) {
                $updateData['notes'] = $validated['notes'];
            }

            $rental->update($updateData);
        });

        return response()->json([
            'message' => 'Rental berhasil diperbarui.',
        ]);
    }

    public function refund(int $id)
    {
        try {
            Log::info('REFUND START', [
                'rental_id' => $id,
            ]);

            $rental = Rental::findOrFail($id);

            Log::info('RENTAL FOUND', [
                'id' => $rental->id,
                'status' => $rental->status,
                'payment_status' => $rental->payment_status,
            ]);

            if ($rental->payment_status !== 'paid') {
                Log::warning('REFUND FAILED - PAYMENT NOT PAID', [
                    'rental_id' => $rental->id,
                    'payment_status' => $rental->payment_status,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Rental belum dibayar.',
                ], 422);
            }

            if ($rental->status !== 'approved') {
                Log::warning('REFUND FAILED - INVALID STATUS', [
                    'rental_id' => $rental->id,
                    'status' => $rental->status,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Refund hanya bisa dilakukan sebelum kendaraan diserahkan.',
                ], 422);
            }

            $payment = Payment::where('rental_id', $rental->id)
                ->latest()
                ->first();

            if (!$payment) {
                Log::warning('REFUND FAILED - PAYMENT NOT FOUND', [
                    'rental_id' => $rental->id,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Data pembayaran tidak ditemukan.',
                ], 404);
            }

            Log::info('PAYMENT FOUND', [
                'payment_id' => $payment->id,
                'payment_status' => $payment->payment_status,
                'amount' => $payment->amount,
                'order_id' => $payment->order_id,
            ]);

            if (!config('midtrans.is_production')) {
                Log::info('REFUND SANDBOX MODE');

                DB::transaction(function () use (
                    $payment,
                    $rental
                ) {
                    $payment->update([
                        'payment_status' => 'refund',
                        'notes' => 'Refund Sandbox',
                    ]);

                    $rental->update([
                        'payment_status' => 'refunded',
                        'status' => 'cancelled',
                    ]);
                });

                Log::info('REFUND SANDBOX SUCCESS', [
                    'rental_id' => $rental->id,
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
                    'message' => 'Refund Sandbox berhasil diproses',
                ]);
            }

            $payment = Payment::where('rental_id', $rental->id)
                ->whereIn('payment_status', [
                    'settlement',
                    'capture',
                ])
                ->latest()
                ->first();

            if (!$payment) {
                Log::warning('MIDTRANS PAYMENT NOT FOUND', [
                    'rental_id' => $rental->id,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Transaksi Midtrans tidak ditemukan.',
                ], 404);
            }

            $baseUrl = config('midtrans.is_production')
                ? 'https://api.midtrans.com'
                : 'https://api.sandbox.midtrans.com';

            Log::info('CALL MIDTRANS REFUND', [
                'order_id' => $payment->order_id,
                'base_url' => $baseUrl,
            ]);

            $response = Http::withBasicAuth(
                config('midtrans.server_key'),
                ''
            )->post(
                "{$baseUrl}/v2/{$payment->order_id}/refund",
                [
                    'refund_key' => 'RF-' . now()->timestamp,
                    'amount' => (int) $payment->amount,
                    'reason' => 'Pembatalan rental',
                ]
            );

            $data = $response->json();

            Log::info('MIDTRANS RESPONSE', [
                'http_status' => $response->status(),
                'response' => $data,
            ]);

            if (
                !$response->successful() ||
                !isset($data['status_code']) ||
                !in_array((string) $data['status_code'], ['200', '201'], true)
            ) {
                Log::error('MIDTRANS REFUND FAILED', [
                    'response' => $data,
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
                    'notes' => 'Refund Midtrans',
                ]);

                $rental->update([
                    'payment_status' => 'refunded',
                    'status' => 'cancelled',
                ]);
            });

            Log::info('REFUND SUCCESS', [
                'rental_id' => $rental->id,
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

        $customerName = $rental->user?->full_name
            ?: $rental->customer_name
            ?: 'Customer';

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

        $customerName = $rental->user?->full_name
            ?: $rental->customer_name
            ?: 'Customer';

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

private function sendRentalStartedWhatsapp(Rental $rental): void
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
        "Masa sewa kendaraan Anda telah dimulai.\n\n" .
        "Kode Booking: {$rental->booking_code}\n" .
        "Kendaraan: " . ($rental->vehicle->name ?? '-') . "\n" .
        "Mulai Sewa: " . optional($rental->start_date)->format('d/m/Y H:i') . "\n" .
        "Batas Kembali: " . optional($rental->end_date)->format('d/m/Y H:i') . "\n\n" .
        "Mohon menjaga kendaraan dengan baik dan mengembalikan tepat waktu.\n\n" .
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
            'rental_started',
            isset($response['id']) ? (string) $response['id'] : null,
            null
        );
    } catch (\Throwable $e) {
        Log::error('Gagal kirim WA rental dimulai', [
            'rental_id' => $rental->id,
            'error' => $e->getMessage(),
        ]);

        $this->logWhatsappMessage(
            $rental->id,
            $rental->user_id,
            $phone,
            $message,
            'failed',
            'rental_started',
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

        $customerName = $rental->user?->full_name
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
                isset($response['id']) ? (string) $response['id'] : null,
                null
            );
        } catch (\Throwable $e) {
            Log::error('Gagal kirim WA denda keterlambatan', [
                'rental_id' => $rental->id,
                'error' => $e->getMessage(),
            ]);

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
                fn ($q) => $q->where('id', '!=', $ignoreRentalId)
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
        'has_late_fine' => ['nullable', 'boolean'],
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
        | Denda keterlambatan by system
        |--------------------------------------------------------------------------
        | Denda manual dari admin tidak dipakai lagi.
        | Jika ada data manual lama yang belum dibayar, dihapus agar tidak ikut.
        |--------------------------------------------------------------------------
        */

        $rental->lateFines()
            ->where('calculation_type', 'manual')
            ->where('status', 'unpaid')
            ->delete();

        $totalExtra = (float) $rental->lateFines()
            ->where('status', 'unpaid')
            ->sum('total_fine');

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

        $newStatus = $totalExtra > 0
            ? 'waiting_payment'
            : 'completed';

        $rental->update([
            'status' => $newStatus,
            'inspected_at' => now(),
            'has_late_fine' => (float) $rental->lateFines()
                ->where('status', 'unpaid')
                ->sum('total_fine') > 0,
            'has_damage' => count($damages) > 0,
            'total_extra_cost' => $totalExtra,
        ]);
    });

    return $this->success(
        $this->transformRental(
            $rental->fresh([
                'lateFines',
                'damages',
            ])
        ),
        'Inspeksi kendaraan berhasil.'
    );
}

    public function pay(Request $request, int $id)
    {
        return $this->error(
            'Pembayaran rental hanya dapat dilakukan oleh customer melalui sistem.',
            403
        );
    }

    public function payAdditionalCost(Request $request, int $id)
    {
        return $this->error(
            'Pembayaran tambahan hanya dapat dilakukan oleh customer melalui sistem.',
            403
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