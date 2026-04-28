<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('odds_snapshots', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fixture_id')->index();
            $table->unsignedBigInteger('bookmaker_id')->index();
            $table->string('market')->index();
            $table->string('selection');
            $table->decimal('odd', 10, 4);
            $table->timestamp('received_at')->useCurrent();
            $table->json('raw')->nullable();
            $table->timestamps();

            $table->index(['fixture_id', 'market', 'selection']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('odds_snapshots');
    }
};
