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
        $rental = Rental::query()->findOrFail($id);

    if (
        $rental->status !== 'paid' ||
        $rental->payment_status !== 'paid'
    ) {
        return $this->error(
            'Rental belum bisa berjalan karena pembayaran belum lunas.',
            422
        );
    }

        $rental->update([
            'status' => 'ongoing',
            'actual_pickup_at' => $rental->actual_pickup_at ?: now(),
        ]);

        $rental->load([
            'user:id,full_name,email,phone_number,address',
            'vehicle:id,name,plate_number,daily_rate,vehicle_type_id',
            'vehicle.type:id,code,name',
            'approvedBy:id,full_name',
            'rejectedBy:id,full_name',
            'payments:id,rental_id,amount,payment_method,payment_status,payment_type,paid_at',
        ]);

        return $this->success($this->transformRental($rental), 'Rental mulai berjalan.');
    }

    public function complete(Request $request, Rental $rental)
    {
        if (
            !in_array($rental->status, [
                'ongoing',
                'overdue'
            ])
        ) {

            return response()->json([
                'message' => 'Rental belum bisa diselesaikan.'
            ], 422);
        }

        $request->validate([
            'actual_return_at' => [
                'nullable',
                'date'
            ]
        ]);

        $rental->update([
            'status' => 'returned',

            'actual_return_at' =>
                $request->actual_return_at
                ?? now(),
        ]);

        return response()->json([
            'message' =>
                'Kendaraan berhasil dikembalikan.'
        ]);
    }

    public function updateStatusPayment(Request $request, Rental $rental)
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'payment_status' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string'],
            'payment_type' => ['nullable', 'string'],
            'amount' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
        ]);

        $current = $rental->status;
        $next = $validated['status'] ?? $current;

        $allowedTransitions = [

            'pending' => [
                'approved',
                'rejected',
            ],

            'approved' => [
                'paid',
                'cancelled',
            ],

            'paid' => [
                'ongoing',
            ],

            'ongoing' => [
                'overdue',
                'returned',
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
        ];

        if (
            $next !== $current &&
            (
                !isset($allowedTransitions[$current]) ||
                !in_array($next, $allowedTransitions[$current])
            )
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

            // simpan payment kalau ada nominal
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

                    'payment_status' =>
                        $validated['payment_status']
                        ?? 'paid',

                    'paid_at' => now(),
                ]);
            }
        });

        return response()->json([
            'message' => 'Rental berhasil diperbarui.'
        ]);
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


    public function inspect(Request $request, Rental $rental)
    {
        if (
            !in_array($rental->status, [
                'returned',
                'inspection',
            ])
        ) {

            return response()->json([
                'message' =>
                    'Rental belum masuk inspeksi.'
            ], 422);
        }

        $validated = $request->validate([

            'has_late_fine' => [
                'required',
                'boolean',
            ],

            'late_fine_amount' => [
                'nullable',
                'numeric',
            ],

            'has_damage' => [
                'required',
                'boolean',
            ],

            'damages' => [
                'nullable',
                'array',
            ],

            'damages.*.description' => [
                'required',
                'string',
            ],

            'damages.*.repair_cost' => [
                'required',
                'numeric',
            ],
        ]);

        DB::transaction(function () use (
            $validated,
            $rental
        ) {

            // masuk inspection
            $rental->update([
                'status' => 'inspection',
            ]);

            $hasFine =
                $validated['has_late_fine'];

            $hasDamage =
                $validated['has_damage'];

            // save fine
            if ($hasFine) {

                $rental->update([
                    'late_fine_amount' =>
                        $validated['late_fine_amount']
                ]);
            }

            // save damage
            if (
                $hasDamage &&
                !empty($validated['damages'])
            ) {

                foreach (
                    $validated['damages']
                    as $damage
                ) {

                    $rental->damages()->create([
                        'description' =>
                            $damage['description'],

                        'repair_cost' =>
                            $damage['repair_cost'],
                    ]);
                }
            }

            // next flow
            if ($hasFine || $hasDamage) {

                $rental->update([
                    'status' =>
                        'waiting_payment'
                ]);
            }

            else {

                $rental->update([
                    'status' =>
                        'completed'
                ]);
            }
        });

        return response()->json([
            'message' =>
                'Inspeksi berhasil.'
        ]);
    }

    public function inspectVehicle(Request $request, int $id)
    {
        $validated = $request->validate([
            'has_late_fine' => 'required|boolean',
            'late_fine_amount' => 'nullable|numeric|min:0',

            'has_damage' => 'required|boolean',

            'damages' => 'nullable|array',
            'damages.*.description' => 'required|string|max:1000',
            'damages.*.repair_cost' => 'required|numeric|min:0',
        ]);

        $rental = Rental::findOrFail($id);

        if (!in_array($rental->status, [
            'ongoing',
            'overdue',
        ], true)) {

            return $this->error(
                'Rental belum bisa diinspeksi.',
                422
            );
        }

        DB::transaction(function () use (
            $validated,
            $rental
        ) {

            $totalExtra = 0;

            if ($validated['has_late_fine']) {

                $fineAmount = (float)
                    ($validated['late_fine_amount'] ?? 0);

                $rental->lateFines()->create([
                    'total_fine' => $fineAmount,
                    'status' => 'unpaid',
                ]);

                $totalExtra += $fineAmount;
            }

            if ($validated['has_damage']) {

                foreach (($validated['damages'] ?? []) as $damage) {

                    $repairCost = (float)
                        $damage['repair_cost'];

                    $rental->damages()->create([
                        'vehicle_id' => $rental->vehicle_id,
                        'description' => $damage['description'],
                        'repair_cost' => $repairCost,
                        'status' => 'pending',
                    ]);

                    $totalExtra += $repairCost;
                }
            }

        $newStatus = $totalExtra > 0
            ? 'waiting_payment'
            : 'completed';

        $rental->update([
            'status' => $newStatus,
            'inspected_at' => now(),
            'has_late_fine' => $validated['has_late_fine'],
            'has_damage' => $validated['has_damage'],
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
                'status' => 'paid',
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

    private function canTransitionStatus(string $current, string $next): bool
{
    $current = strtolower($current);
    $next = strtolower($next);

    $allowed = [

        'pending' => [
            'approved',
            'rejected',
            'cancelled',
        ],

        'approved' => [
            'paid',
            'rejected',
            'cancelled',
        ],

        'paid' => [
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