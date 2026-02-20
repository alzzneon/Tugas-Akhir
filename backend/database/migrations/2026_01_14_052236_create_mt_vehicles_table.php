<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mt_vehicles', function (Blueprint $table) {
            $table->id();

            // FK to master tables
            $table->foreignId('vehicle_type_id')->constrained('mt_vehicle_types');
            $table->foreignId('vehicle_brand_id')->constrained('mt_vehicle_brands');
            $table->foreignId('transmission_id')->nullable()->constrained('mt_transmissions');

            // Vehicle fields
            $table->string('name', 120);                  // e.g. Toyota Avanza 2023
            $table->string('plate_number', 20)->unique(); // e.g. B 1234 CD
            $table->unsignedSmallInteger('year')->nullable();
            $table->string('color', 50)->nullable();

            $table->decimal('daily_rate', 12, 2)->default(0);
            $table->text('description')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['vehicle_type_id', 'is_active']);
            $table->index(['vehicle_brand_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mt_vehicles');
    }
};
