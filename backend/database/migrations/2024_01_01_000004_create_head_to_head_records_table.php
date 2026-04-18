<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('head_to_head_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_home_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('team_away_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('match_id')->nullable()->constrained()->onDelete('setNull');
            $table->integer('home_wins')->default(0);
            $table->integer('away_wins')->default(0);
            $table->integer('draws')->default(0);
            $table->integer('home_goals')->default(0);
            $table->integer('away_goals')->default(0);
            $table->integer('total_matches')->default(0);
            $table->dateTime('last_meeting')->nullable();
            $table->timestamps();
            
            $table->unique(['team_home_id', 'team_away_id']);
            $table->index('last_meeting');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('head_to_head_records');
    }
};