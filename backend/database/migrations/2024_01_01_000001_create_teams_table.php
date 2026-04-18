<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->string('api_id')->unique()->nullable();
            $table->string('name');
            $table->string('short_name', 10)->nullable();
            $table->string('logo')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('venue')->nullable();
            $table->integer('league_id')->nullable();
            $table->string('league_name')->nullable();
            $table->boolean('is_premium')->default(false);
            $table->timestamps();
            
            $table->index('league_id');
            $table->index('is_premium');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teams');
    }
};