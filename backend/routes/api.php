<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\PublicVehicleController;
use App\Http\Controllers\Api\PublicRentalController;

use App\Http\Controllers\Api\Admin\VehicleTypeController;
use App\Http\Controllers\Api\Admin\VehicleBrandController;
use App\Http\Controllers\Api\Admin\TransmissionController;
use App\Http\Controllers\Api\Admin\RentalStatusController;
use App\Http\Controllers\Api\Admin\PaymentStatusController;
use App\Http\Controllers\Api\Admin\VehicleController;
use App\Http\Controllers\Api\Admin\RentalController as AdminRentalController;

use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RentalController;
use App\Http\Controllers\Api\PaymentController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::apiResource('admins', AdminUserController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    Route::prefix('masters')->group(function () {
        Route::apiResource('vehicle-types', VehicleTypeController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::apiResource('vehicle-brands', VehicleBrandController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::apiResource('transmissions', TransmissionController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::apiResource('rental-statuses', RentalStatusController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::apiResource('payment-statuses', PaymentStatusController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::apiResource('vehicles', VehicleController::class)
            ->only(['index', 'store', 'update', 'destroy']);
    });

    Route::get('/users-for-rental', [AdminRentalController::class, 'usersForRental']);

    Route::get('/rentals', [AdminRentalController::class, 'index']);
    Route::get('/rentals/{id}', [AdminRentalController::class, 'show']);
    Route::post('/rentals', [AdminRentalController::class, 'store']);
    Route::patch('/rentals/{id}/approve', [AdminRentalController::class, 'approve']);
    Route::patch('/rentals/{id}/reject', [AdminRentalController::class, 'reject']);
    Route::patch('/rentals/{id}/mark-ongoing', [AdminRentalController::class, 'markOngoing']);
    Route::patch('/rentals/{id}/complete', [AdminRentalController::class, 'complete']);
    Route::patch('/rentals/{id}/update-status-payment', [AdminRentalController::class, 'updateStatusPayment']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

    Route::get('/my-rentals', [RentalController::class, 'index']);
    Route::post('/my-rentals', [RentalController::class, 'store']);

    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);
});

Route::prefix('public')->group(function () {
    Route::get('/vehicles', [PublicVehicleController::class, 'index']);
    Route::post('/rentals', [PublicRentalController::class, 'store']);
});