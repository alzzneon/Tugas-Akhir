<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Transaction;
use App\Models\Rental;
use App\Models\Payment;

class MidtransController extends Controller
{
    public function createTransaction(Request $request)
    {
        try {

            /*
            |--------------------------------------------------------------------------
            | VALIDATION
            |--------------------------------------------------------------------------
            */

            $request->validate([
                'rental_id' => 'required|exists:rentals,id',
            ]);

            /*
            |--------------------------------------------------------------------------
            | GET RENTAL
            |--------------------------------------------------------------------------
            */

            $rental = Rental::with('user')->findOrFail($request->rental_id);

            /*
            |--------------------------------------------------------------------------
            | MIDTRANS CONFIG
            |--------------------------------------------------------------------------
            */

            Config::$serverKey = env('MIDTRANS_SERVER_KEY');
            Config::$isProduction = false;
            Config::$isSanitized = true;
            Config::$is3ds = true;

            /*
            |--------------------------------------------------------------------------
            | ORDER ID
            |--------------------------------------------------------------------------
            */

            $orderId = 'RENT-' . time() . '-' . $rental->id;

            /*
            |--------------------------------------------------------------------------
            | CREATE PAYMENT
            |--------------------------------------------------------------------------
            */

            $payment = Payment::create([
                'rental_id' => $rental->id,
                'amount' => $rental->total_price,
                'payment_method' => 'midtrans',
                'payment_status' => 'pending',
                'payment_type' => 'full',
                'provider' => 'midtrans',
                'order_id' => $orderId,
            ]);

            /*
            |--------------------------------------------------------------------------
            | MIDTRANS PARAMS
            |--------------------------------------------------------------------------
            */

            $params = [
                'transaction_details' => [
                    'order_id' => $orderId,
                    'gross_amount' => (int) $rental->total_price,
                ],

                'customer_details' => [
                    'first_name' => $rental->customer_name,
                    'email' => $rental->customer_email,
                    'phone' => $rental->customer_phone,
                ],
            ];

            /*
            |--------------------------------------------------------------------------
            | GET SNAP TOKEN
            |--------------------------------------------------------------------------
            */

            $snapToken = Snap::getSnapToken($params);

            /*
            |--------------------------------------------------------------------------
            | SAVE TOKEN
            |--------------------------------------------------------------------------
            */

            $payment->update([
                'snap_token' => $snapToken,
            ]);

            /*
            |--------------------------------------------------------------------------
            | RESPONSE
            |--------------------------------------------------------------------------
            */

            return response()->json([
                'success' => true,
                'message' => 'Berhasil membuat transaksi',
                'data' => [
                    'snap_token' => $snapToken,
                    'order_id' => $orderId,
                ]
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
            'order_id' => 'required'
        ]);

        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');

        $status = Transaction::status(
            $request->order_id
        );

        $payment = Payment::where(
            'order_id',
            $request->order_id
        )->first();

        if (!$payment) {

            return response()->json([
                'success' => false,
                'message' => 'Payment tidak ditemukan'
            ], 404);

        }

        if (
            $status->transaction_status === 'settlement' ||
            $status->transaction_status === 'capture'
        ) {

            $payment->update([
                'payment_status' => $status->transaction_status,
                'transaction_id' => $status->transaction_id ?? null,
                'paid_at' => now(),
                'raw_response' => (array) $status,
            ]);

            $payment->rental()->update([
                'payment_status' => 'paid'
            ]);
        }

        return response()->json([
            'success' => true,
            'transaction_status' => $status->transaction_status
        ]);
    }

    public function notificationHandler(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Notification received',
        ]);
    }
}