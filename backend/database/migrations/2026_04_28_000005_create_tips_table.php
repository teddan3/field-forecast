<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('tips', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('fixture_id')->index();
            $table->string('market');
            $table->string('selection');
            $table->decimal('odd_posted', 10, 4);
            $table->decimal('stake', 10, 2)->default(0);
            $table->enum('status', ['open','won','lost','void'])->default('open');
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tips');
    }
};
