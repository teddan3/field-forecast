<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->foreignId('match_id')->constrained()->onDelete('cascade');
            $table->integer('league_id')->nullable();
            $table->integer('position')->nullable();
            $table->integer('games_played')->default(0);
            $table->integer('wins')->default(0);
            $table->integer('draws')->default(0);
            $table->integer('losses')->default(0);
            $table->integer('goals_for')->default(0);
            $table->integer('goals_against')->default(0);
            $table->integer('points')->default(0);
            $table->integer('form_w')->default(0);
            $table->integer('form_d')->default(0);
            $table->integer('form_l')->default(0);
            $table->float(' possession')->nullable();
            $table->integer('shots_on_target')->nullable();
            $table->integer('shots_off_target')->nullable();
            $table->integer('corners')->nullable();
            $table->integer('fouls')->nullable();
            $table->integer('yellow_cards')->nullable();
            $table->integer('red_cards')->nullable();
            $table->timestamps();
            
            $table->unique(['team_id', 'match_id']);
            $table->index('league_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_stats');
    }
};