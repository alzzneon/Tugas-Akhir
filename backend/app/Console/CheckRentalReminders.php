<?php

namespace App\Console\Commands;

use App\Models\Rental;
use App\Services\FonnteService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckRentalReminders extends Command
{
    protected $signature = 'rentals:check-reminders';

    protected $description = 'Mengirim WhatsApp pengingat pengembalian rental dan menandai rental overdue.';

    public function __construct(
        protected FonnteService $fonnteService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $now = now();

        $this->sendReturnReminders($now);
        $this->markOverdueAndNotify($now);

        $this->info('Rental reminders checked.');

        return self::SUCCESS;
    }

    private function sendReturnReminders(Carbon $now): void
    {
        $reminderUntil = $now->copy()->addHours(2);

        Rental::query()
            ->with([
                'user',
                'vehicle',
            ])
            ->where('status', 'ongoing')
            ->whereNotNull('end_date')
            ->whereBetween('end_date', [
                $now,
                $reminderUntil,
            ])
            ->chunkById(50, function ($rentals) {
                foreach ($rentals as $rental) {
                    if ($this->wasWhatsappSent(
                        $rental->id,
                        'rental_return_reminder'
                    )) {
                        continue;
                    }

                    $this->sendReturnReminderWhatsapp($rental);
                }
            });
    }

    private function markOverdueAndNotify(Carbon $now): void
    {
        Rental::query()
            ->with([
                'user',
                'vehicle',
            ])
            ->where('status', 'ongoing')
            ->whereNotNull('end_date')
            ->where('end_date', '<', $now)
            ->chunkById(50, function ($rentals) {
                foreach ($rentals as $rental) {
                    DB::transaction(function () use ($rental) {
                        $rental->update([
                            'status' => 'overdue',
                            'overdue_started_at' => $rental->overdue_started_at ?: now(),
                        ]);
                    });

                    if ($this->wasWhatsappSent(
                        $rental->id,
                        'rental_overdue'
                    )) {
                        continue;
                    }

                    $this->sendOverdueWhatsapp($rental->fresh([
                        'user',
                        'vehicle',
                    ]));
                }
            });
    }

    private function sendReturnReminderWhatsapp(Rental $rental): void
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
            "Masa sewa kendaraan Anda akan segera selesai.\n\n" .
            "Kode Booking: {$rental->booking_code}\n" .
            "Kendaraan: " . ($rental->vehicle->name ?? '-') . "\n" .
            "Batas Pengembalian: " . optional($rental->end_date)->format('d/m/Y H:i') . "\n\n" .
            "Mohon segera mengembalikan kendaraan tepat waktu.\n\n" .
            "Terima kasih.";

        $this->sendWhatsapp(
            $rental,
            $phone,
            $message,
            'rental_return_reminder'
        );
    }

    private function sendOverdueWhatsapp(Rental $rental): void
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
            "Masa sewa kendaraan Anda telah melewati batas pengembalian.\n\n" .
            "Kode Booking: {$rental->booking_code}\n" .
            "Kendaraan: " . ($rental->vehicle->name ?? '-') . "\n" .
            "Batas Pengembalian: " . optional($rental->end_date)->format('d/m/Y H:i') . "\n\n" .
            "Mohon segera mengembalikan kendaraan. Keterlambatan dapat dikenakan denda oleh sistem.\n\n" .
            "Terima kasih.";

        $this->sendWhatsapp(
            $rental,
            $phone,
            $message,
            'rental_overdue'
        );
    }

    private function sendWhatsapp(
        Rental $rental,
        string $phone,
        string $message,
        string $messageType
    ): void {
        try {
            $response = $this->fonnteService->sendMessage(
                $phone,
                $message
            );

            $this->logWhatsappMessage(
                rentalId: $rental->id,
                userId: $rental->user_id,
                phoneNumber: $phone,
                message: $message,
                status: 'sent',
                messageType: $messageType,
                providerMessageId: isset($response['id'])
                    ? (string) $response['id']
                    : null,
                errorMessage: null
            );
        } catch (\Throwable $e) {
            Log::error('Gagal kirim WA scheduler rental', [
                'rental_id' => $rental->id,
                'message_type' => $messageType,
                'error' => $e->getMessage(),
            ]);

            $this->logWhatsappMessage(
                rentalId: $rental->id,
                userId: $rental->user_id,
                phoneNumber: $phone,
                message: $message,
                status: 'failed',
                messageType: $messageType,
                providerMessageId: null,
                errorMessage: $e->getMessage()
            );
        }
    }

    private function wasWhatsappSent(
        int $rentalId,
        string $messageType
    ): bool {
        return DB::table('whatsapp_messages')
            ->where('rental_id', $rentalId)
            ->where('message_type', $messageType)
            ->where('status', 'sent')
            ->exists();
    }

    private function resolveWhatsappPhone(Rental $rental): ?string
    {
        $phone = $rental->user?->phone_number
            ?: $rental->customer_phone;

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
            Log::error('Gagal menyimpan log WA scheduler', [
                'rental_id' => $rentalId,
                'message_type' => $messageType,
                'error' => $e->getMessage(),
            ]);
        }
    }
}