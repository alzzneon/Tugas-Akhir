<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FonnteService
{
    public function sendMessage(string $target, string $message): array
    {
        $target = $this->normalizePhoneNumber($target);

        if (empty($target)) {
            throw new \InvalidArgumentException('Nomor WhatsApp tidak valid.');
        }

        $response = Http::withHeaders([
            'Authorization' => config('services.fonnte.token'),
        ])->asForm()->post(config('services.fonnte.base_url') . '/send', [
            'target' => $target,
            'message' => $message,
            'countryCode' => '62',
        ]);

        if (!$response->successful()) {
            Log::error('Fonnte send failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'target' => $target,
            ]);

            throw new \RuntimeException('Gagal mengirim WhatsApp melalui Fonnte.');
        }

        return $response->json() ?? [];
    }

    private function normalizePhoneNumber(?string $phone): string
    {
        $phone = preg_replace('/\D+/', '', (string) $phone);

        if (!$phone) {
            return '';
        }

        if (str_starts_with($phone, '0')) {
            return substr($phone, 1);
        }

        if (str_starts_with($phone, '62')) {
            return substr($phone, 2);
        }

        return $phone;
    }
}