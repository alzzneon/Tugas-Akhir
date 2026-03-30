<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\PublicVehicleController;

use App\Http\Controllers\Api\Admin\VehicleTypeController;
use App\Http\Controllers\Api\Admin\VehicleBrandController;
use App\Http\Controllers\Api\Admin\TransmissionController;
use App\Http\Controllers\Api\Admin\RentalStatusController;
use App\Http\Controllers\Api\Admin\PaymentStatusController;
use App\Http\Controllers\Api\Admin\VehicleController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Route::get('/ping', function () {
//     return response()->json(['message' => 'pong']);
// });

Route::post('/login', [AuthController::class, 'login']);

// semua route /admin/
// Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
Route::prefix('admin')->middleware(['auth:sanctum','admin'])->group(function () {

    Route::apiResource('admins', AdminUserController::class)
        ->only(['index','store','update','destroy']);

    Route::prefix('masters')->group(function () {

        // ===== Masters (CRUD) =====
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

        // ===== Vehicles (Admin CRUD) =====
        Route::apiResource('vehicles', VehicleController::class)
            ->only(['index', 'store', 'update', 'destroy']);
    });
});

Route::post('/register', [AuthController::class, 'register']);

Route::prefix('public')->group(function () {
    Route::get('/vehicles', [PublicVehicleController::class, 'index']);

});
