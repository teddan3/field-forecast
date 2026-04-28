<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('odds_aggregates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fixture_id')->index();
            $table->string('market')->index();
            $table->json('best_offer')->nullable();
            $table->json('implied_probs')->nullable();
            $table->decimal('vig', 8, 4)->default(0);
            $table->timestamp('computed_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('odds_aggregates');
    }
};
