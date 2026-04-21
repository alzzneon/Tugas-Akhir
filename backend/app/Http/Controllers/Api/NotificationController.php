<?php

namespace App\Http\Controllers\Api;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends ResourceController
{
    public function index(Request $request)
    {
        $rows = Notification::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(30)
            ->get()
            ->map(fn (Notification $n) => $this->transformNotification($n));

        return $this->success($rows);
    }

    public function unreadCount(Request $request)
    {
        $count = Notification::query()
            ->where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return $this->success([
            'unread_count' => $count,
        ]);
    }

    public function markAsRead(Request $request, int $id)
    {
        $notification = Notification::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->update([
            'is_read' => true,
        ]);

        return $this->success(
            $this->transformNotification($notification),
            'Notifikasi ditandai sudah dibaca.'
        );
    }

    public function markAllAsRead(Request $request)
    {
        Notification::query()
            ->where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
            ]);

        return $this->success(null, 'Semua notifikasi ditandai sudah dibaca.');
    }

    private function transformNotification(Notification $n): array
    {
        return [
            'id' => $n->id,
            'title' => $n->title,
            'message' => $n->message,
            'type' => $n->type,
            'reference_type' => $n->reference_type,
            'reference_id' => $n->reference_id,
            'is_read' => $n->is_read,
            'created_at' => optional($n->created_at)->toDateTimeString(),
        ];
    }
}