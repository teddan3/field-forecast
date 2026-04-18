<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->string('api_id')->unique()->nullable();
            $table->foreignId('home_team_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('away_team_id')->constrained('teams')->onDelete('cascade');
            $table->string('competition')->nullable();
            $table->integer('competition_id')->nullable();
            $table->string('round')->nullable();
            $table->integer('season')->nullable();
            $table->dateTime('match_date');
            $table->string('status', 50)->default('scheduled');
            $table->string('status_long')->nullable();
            $table->integer('elapsed')->nullable();
            $table->integer('home_score')->nullable();
            $table->integer('away_score')->nullable();
            $table->integer('home_half_time')->nullable();
            $table->integer('away_half_time')->nullable();
            $table->string('venue')->nullable();
            $table->string('city')->nullable();
            $table->string('referee')->nullable();
            $table->boolean('is_live')->default(false);
            $table->boolean('is_premium')->default(false);
            $table->timestamps();
            
            $table->index('competition_id');
            $table->index('match_date');
            $table->index('is_live');
            $table->index('is_premium');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};