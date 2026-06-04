<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Rental;

use Illuminate\Http\Request;

use Midtrans\Config;
use Midtrans\Snap;

class PaymentController extends Controller
{

    public function index()
    {
        $payments = Payment::latest()->get();

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    public function store(Request $request)
    {
        try {

            $request->validate([
                'rental_id' => 'required|exists:rentals,id',
            ]);

            Config::$serverKey = config('midtrans.server_key');
            Config::$isProduction = config('midtrans.is_production');
            Config::$isSanitized = config('midtrans.is_sanitized');
            Config::$is3ds = config('midtrans.is_3ds');

            $rental = Rental::with('user')->findOrFail($request->rental_id);

            $orderId = 'RENT-' . time() . '-' . $rental->id;

            $grossAmount = (int) $rental->total_price;


            $params = [

                'transaction_details' => [
                    'order_id' => $orderId,
                    'gross_amount' => $grossAmount,
                ],

                'customer_details' => [
                    'first_name' => $rental->user->name ?? 'Customer',
                    'email' => $rental->user->email ?? 'customer@mail.com',
                ],
            ];

            $snapToken = Snap::getSnapToken($params);

            $payment = Payment::create([

                'rental_id' => $rental->id,

                'amount' => $grossAmount,

                'payment_method' => 'midtrans',

                'payment_status' => 'pending',

                'payment_type' => 'full',

                'provider' => 'midtrans',

                'order_id' => $orderId,

                'snap_token' => $snapToken,

                'currency' => 'IDR',
            ]);

            return response()->json([
                'success' => true,

                'message' => 'Payment created successfully',

                'data' => [
                    'snap_token' => $snapToken,
                    'order_id' => $orderId,
                    'payment_id' => $payment->id,
                ]
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);

        }
    }
}
