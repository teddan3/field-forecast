<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->boolean('is_valid')->default(true)->after('is_premium');
            $table->index('is_valid');
            $table->index(['match_date', 'is_valid']);
            $table->index(['is_live', 'is_valid']);
        });
    }

    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->dropColumn('is_valid');
        });
    }
};