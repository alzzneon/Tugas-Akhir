<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Notification;
use App\Models\User;

trait CreatesNotifications
{
    protected function createNotification(
        string $userId,
        string $title,
        string $message,
        string $type,
        ?string $referenceType = null,
        ?int $referenceId = null
    ): void {
        Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'is_read' => false,
            'created_at' => now(),
        ]);
    }

    protected function notifyAllAdmins(
        string $title,
        string $message,
        string $type,
        ?string $referenceType = null,
        ?int $referenceId = null
    ): void {
        $adminIds = User::query()
            ->whereIn('role', ['admin', 'super_admin'])
            ->pluck('id');

        foreach ($adminIds as $adminId) {
            $this->createNotification(
                $adminId,
                $title,
                $message,
                $type,
                $referenceType,
                $referenceId
            );
        }
    }
}