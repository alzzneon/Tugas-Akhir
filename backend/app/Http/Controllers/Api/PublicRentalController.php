<!-- <?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rental;
use App\Models\User;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PublicRentalController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => ['required', 'integer', 'exists:mt_vehicles,id'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'address' => ['required', 'string'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'notes' => ['nullable', 'string'],
        ]);

        $vehicle = Vehicle::query()
            ->where('is_active', true)
            ->findOrFail($validated['vehicle_id']);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);

        if ($this->hasConflict($vehicle->id, $startDate, $endDate)) {
            return response()->json([
                'status' => false,
                'message' => 'Jadwal kendaraan bentrok dengan rental lain.',
            ], 422);
        }

        $totalDays = max(1, $startDate->diffInDays($endDate) + 1);
        $totalPrice = $totalDays * (float) $vehicle->daily_rate;

        $cleanPhone = preg_replace('/[^0-9]/', '', $validated['customer_phone']);
        $generatedEmail = 'cust_' . $cleanPhone . '@rentcare.local';

        $rental = DB::transaction(function () use (
            $validated,
            $vehicle,
            $startDate,
            $endDate,
            $totalDays,
            $totalPrice,
            $cleanPhone,
            $generatedEmail
        ) {
            $user = User::query()->where('email', $generatedEmail)->first();

            if (!$user) {
                $user = User::create([
                    'full_name' => $validated['customer_name'],
                    'email' => $generatedEmail,
                    'phone_number' => $cleanPhone,
                    'address' => $validated['address'],
                    'password' => Hash::make('customer123'),
                    'role' => 'customer',
                ]);
            } else {
                $dirty = false;

                if (empty($user->full_name)) {
                    $user->full_name = $validated['customer_name'];
                    $dirty = true;
                }

                if (empty($user->phone_number)) {
                    $user->phone_number = $cleanPhone;
                    $dirty = true;
                }

                if (empty($user->address)) {
                    $user->address = $validated['address'];
                    $dirty = true;
                }

                if ($dirty) {
                    $user->save();
                }
            }

            $notes = trim(
                ($validated['notes'] ?? '') .
                "\n[PUBLIC_BOOKING]" .
                "\nNama: " . $validated['customer_name'] .
                "\nTelepon: " . $validated['customer_phone'] .
                "\nAlamat: " . $validated['address']
            );

            return Rental::create([
                'user_id' => $user->id,
                'vehicle_id' => $vehicle->id,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'total_date' => $totalDays,
                'total_price' => $totalPrice,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'dp_amount' => 0,
                'paid_amount' => 0,
                'remaining_amount' => $totalPrice,
                'booking_code' => 'BK-' . strtoupper(Str::random(8)),
                'notes' => $notes,
            ]);
        });

        return response()->json([
            'status' => true,
            'message' => 'Booking berhasil dibuat dan menunggu proses admin.',
            'data' => $rental,
        ], 201);
    }

    private function hasConflict(int $vehicleId, Carbon $start, Carbon $end): bool
    {
        return Rental::query()
            ->where('vehicle_id', $vehicleId)
            ->whereIn('status', [
                'pending',
                'approved',
                'waiting_payment',
                'paid_partial',
                'paid',
                'ongoing',
                'overdue',
            ])
            ->where(function ($q) use ($start, $end) {
                $q->where('start_date', '<', $end)
                  ->where('end_date', '>', $start);
            })
            ->exists();
    }
} -->