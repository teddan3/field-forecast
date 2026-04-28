<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('arbitrage_alerts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fixture_id')->index();
            $table->string('market');
            $table->json('legs');
            $table->decimal('profit_pct', 8, 4);
            $table->timestamp('detected_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('arbitrage_alerts');
    }
};
