<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Rental;
use Illuminate\Http\Request;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Transaction;

class MidtransController extends Controller
{
    public function createTransaction(Request $request)
    {
        try {

            $request->validate([
                'rental_id' => 'required|exists:rentals,id',
                'payment_type' => 'nullable|in:full,extra',
            ]);


            $rental = Rental::with('user')->findOrFail($request->rental_id);

            $this->configureMidtrans();

            $paymentType = $request->payment_type ?? 'full';

            if ($paymentType === 'extra') {
                $amount = $this->getExtraAmount($rental);

                if ($amount <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Tidak ada denda atau biaya tambahan yang perlu dibayar.',
                    ], 422);
                }

                $orderId = 'RENT-EXTRA-' . time() . '-' . $rental->id;
            } else {
                $amount = (int) $rental->total_price;

                if ($amount <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Total pembayaran rental tidak valid.',
                    ], 422);
                }

                $orderId = 'RENT-' . time() . '-' . $rental->id;
            }

            $payment = Payment::create([
                'rental_id' => $rental->id,
                'amount' => $amount,
                'payment_method' => 'midtrans',
                'payment_status' => 'pending',
                'payment_type' => $paymentType,
                'provider' => 'midtrans',
                'order_id' => $orderId,
            ]);

            $params = [
                'transaction_details' => [
                    'order_id' => $orderId,
                    'gross_amount' => $amount,
                ],

                'customer_details' => [
                    'first_name' => $rental->customer_name,
                    'email' => $rental->customer_email,
                    'phone' => $rental->customer_phone,
                ],
            ];

            $snapToken = Snap::getSnapToken($params);

            $payment->update([
                'snap_token' => $snapToken,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Berhasil membuat transaksi',
                'data' => [
                    'snap_token' => $snapToken,
                    'order_id' => $orderId,
                    'payment_type' => $paymentType,
                    'amount' => $amount,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function checkStatus(Request $request)
    {
        $request->validate([
            'order_id' => 'required',
        ]);

        $this->configureMidtrans();

        $status = Transaction::status($request->order_id);

        $payment = Payment::where('order_id', $request->order_id)->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment tidak ditemukan',
            ], 404);
        }

        $transactionStatus = $status->transaction_status ?? null;
        $transactionId = $status->transaction_id ?? null;

        $this->updatePaymentStatus(
            payment: $payment,
            transactionStatus: $transactionStatus,
            transactionId: $transactionId,
            rawResponse: (array) $status
        );

        return response()->json([
            'success' => true,
            'transaction_status' => $transactionStatus,
            'payment_type' => $payment->payment_type,
        ]);
    }

    public function notificationHandler(Request $request)
    {
        $payload = $request->all();

        $orderId = $payload['order_id'] ?? null;
        $transactionStatus = $payload['transaction_status'] ?? null;
        $transactionId = $payload['transaction_id'] ?? null;

        if (!$orderId) {
            return response()->json([
                'success' => false,
                'message' => 'Order ID tidak ditemukan',
            ], 400);
        }

        $payment = Payment::where('order_id', $orderId)->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment tidak ditemukan',
            ], 404);
        }

        $this->updatePaymentStatus(
            payment: $payment,
            transactionStatus: $transactionStatus,
            transactionId: $transactionId,
            rawResponse: $payload
        );

        return response()->json([
            'success' => true,
        ]);
    }

    private function configureMidtrans(): void
    {
        Config::$serverKey = config('midtrans.server_key') ?: env('MIDTRANS_SERVER_KEY');
        Config::$isProduction = (bool) config('midtrans.is_production', false);
        Config::$isSanitized = true;
        Config::$is3ds = true;
    }

    private function updatePaymentStatus(
        Payment $payment,
        ?string $transactionStatus,
        ?string $transactionId = null,
        array $rawResponse = []
    ): void {
        switch ($transactionStatus) {
            case 'capture':
            case 'settlement':
                $payment->update([
                    'payment_status' => $transactionStatus,
                    'transaction_id' => $transactionId,
                    'paid_at' => now(),
                    'raw_response' => $rawResponse,
                ]);

                if ($this->isFinePayment($payment)) {
                    $payment->rental()->update([
                        'status' => 'completed',
                        'payment_status' => 'paid',
                    ]);
                } else {
                    $payment->rental()->update([
                        'payment_status' => 'paid',
                    ]);
                }

                break;

            case 'pending':
                $payment->update([
                    'payment_status' => 'pending',
                    'raw_response' => $rawResponse,
                ]);

                break;

            case 'expire':
                $payment->update([
                    'payment_status' => 'expire',
                    'raw_response' => $rawResponse,
                ]);

                if ($this->isFinePayment($payment)) {
                    $payment->rental()->update([
                        'status' => 'waiting_payment',
                    ]);
                } else {
                    $payment->rental()->update([
                        'payment_status' => 'unpaid',
                    ]);
                }

                break;

            case 'cancel':
                $payment->update([
                    'payment_status' => 'cancel',
                    'raw_response' => $rawResponse,
                ]);

                if ($this->isFinePayment($payment)) {
                    $payment->rental()->update([
                        'status' => 'waiting_payment',
                    ]);
                } else {
                    $payment->rental()->update([
                        'payment_status' => 'unpaid',
                    ]);
                }

                break;

            case 'deny':
                $payment->update([
                    'payment_status' => 'deny',
                    'raw_response' => $rawResponse,
                ]);

                if ($this->isFinePayment($payment)) {
                    $payment->rental()->update([
                        'status' => 'waiting_payment',
                    ]);
                } else {
                    $payment->rental()->update([
                        'payment_status' => 'unpaid',
                    ]);
                }

                break;

            case 'refund':
                $payment->update([
                    'payment_status' => 'refund',
                    'raw_response' => $rawResponse,
                ]);

                if ($this->isFinePayment($payment)) {
                    $payment->rental()->update([
                        'status' => 'waiting_payment',
                    ]);
                } else {
                    $payment->rental()->update([
                        'payment_status' => 'refund',
                        'status' => 'cancelled',
                    ]);
                }

                break;

            default:
                $payment->update([
                    'payment_status' => 'pending',
                    'raw_response' => $rawResponse,
                ]);

                break;
        }
    }

    private function getExtraAmount(Rental $rental): int
    {
        return (int) ($rental->total_extra_cost ?? 0);
    }

    private function isFinePayment(Payment $payment): bool
    {
        $orderId = (string) ($payment->order_id ?? '');

        return in_array($payment->payment_type, ['fine', 'extra'], true)
            || str_starts_with($orderId, 'EXTRA-')
            || str_starts_with($orderId, 'RENT-EXTRA-');
    }

}