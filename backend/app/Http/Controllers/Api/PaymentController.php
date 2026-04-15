<?php

namespace App\Http\Controllers\Api;

use App\Models\Payment;
use App\Models\Rental;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PaymentController extends ResourceController
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'rental_id' => ['required', 'integer', 'exists:rentals,id'],
            'payment_type' => ['required', Rule::in(['full', 'dp', 'settlement'])],
            'payment_method' => ['required', 'string', 'max:50'],
            'amount' => ['required', 'numeric', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        $rental = Rental::query()
            ->with('user')
            ->findOrFail($validated['rental_id']);

        $authUser = $request->user();

        if ($authUser->role !== 'admin' && $rental->user_id !== $authUser->id) {
            return $this->error('Tidak punya akses ke rental ini.', 403);
        }

        if (!in_array($rental->status, ['approved', 'paid_partial', 'waiting_payment'], true)) {
            return $this->error('Rental belum bisa dibayar pada status saat ini.', 422);
        }

        $amount = (float) $validated['amount'];
        $remainingBefore = (float) $rental->remaining_amount;

        if ($amount > $remainingBefore) {
            return $this->error('Jumlah pembayaran melebihi sisa tagihan.', 422);
        }

        $payment = DB::transaction(function () use ($validated, $rental, $amount, $remainingBefore) {
            $payment = Payment::create([
                'rental_id' => $rental->id,
                'amount' => $amount,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'paid',
                'payment_type' => $validated['payment_type'],
                'provider' => 'manual',
                'provider_reference' => 'MANUAL-' . now()->format('YmdHis') . '-' . $rental->id,
                'notes' => $validated['notes'] ?? null,
                'paid_at' => now(),
            ]);

            $paidAmount = (float) $rental->paid_amount + $amount;
            $remainingAfter = max(0, $remainingBefore - $amount);

            $paymentStatus = $remainingAfter <= 0 ? 'paid' : 'partial';
            $rentalStatus = $remainingAfter <= 0 ? 'paid' : 'paid_partial';

            $rental->update([
                'paid_amount' => $paidAmount,
                'remaining_amount' => $remainingAfter,
                'payment_status' => $paymentStatus,
                'status' => $rentalStatus,
            ]);

            return $payment;
        });

        $payment->load('rental');

        return $this->created([
            'id' => $payment->id,
            'rental_id' => $payment->rental_id,
            'amount' => $payment->amount,
            'payment_method' => $payment->payment_method,
            'payment_status' => $payment->payment_status,
            'payment_type' => $payment->payment_type,
            'provider' => $payment->provider,
            'provider_reference' => $payment->provider_reference,
            'paid_at' => optional($payment->paid_at)->toDateTimeString(),
        ], 'Pembayaran berhasil dicatat.');
    }

    public function index(Request $request)
    {
        $query = Payment::query()
            ->with([
                'rental:id,user_id,vehicle_id,booking_code,total_price,status,payment_status',
                'rental.user:id,full_name,email,phone_number',
                'rental.vehicle:id,name,plate_number',
            ])
            ->latest('id');

        if ($request->user()->role !== 'admin') {
            $query->whereHas('rental', fn ($q) => $q->where('user_id', $request->user()->id));
        }

        if ($request->filled('rental_id')) {
            $query->where('rental_id', (int) $request->input('rental_id'));
        }

        $rows = $query->get()->map(function (Payment $p) {
            return [
                'id' => $p->id,
                'rental_id' => $p->rental_id,
                'amount' => $p->amount,
                'payment_method' => $p->payment_method,
                'payment_status' => $p->payment_status,
                'payment_type' => $p->payment_type,
                'provider' => $p->provider,
                'provider_reference' => $p->provider_reference,
                'paid_at' => optional($p->paid_at)->toDateTimeString(),
                'rental' => $p->rental ? [
                    'id' => $p->rental->id,
                    'booking_code' => $p->rental->booking_code,
                    'total_price' => $p->rental->total_price,
                    'status' => $p->rental->status,
                    'payment_status' => $p->rental->payment_status,
                    'user' => $p->rental->user ? [
                        'id' => $p->rental->user->id,
                        'full_name' => $p->rental->user->full_name,
                        'email' => $p->rental->user->email,
                        'phone_number' => $p->rental->user->phone_number,
                    ] : null,
                    'vehicle' => $p->rental->vehicle ? [
                        'id' => $p->rental->vehicle->id,
                        'name' => $p->rental->vehicle->name,
                        'plate_number' => $p->rental->vehicle->plate_number,
                    ] : null,
                ] : null,
            ];
        });

        return $this->success($rows);
    }
}