<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('enrollments', function (Blueprint $table) {
        $table->id();
        
        $table->foreignId('utilisateur_id')->constrained('users')->onDelete('cascade');
        $table->foreignId('formation_id')->constrained('formations')->onDelete('cascade');
        $table->unsignedInteger('progression')->default(0);
        $table->timestamp('date_inscription')->useCurrent();
        $table->unique(['utilisateur_id', 'formation_id']); // un apprenant ne peut s'inscrire qu'une seule fois à la même formation
        $table->timestamps();
    });
    Schema::table('enrollments', function (Blueprint $table) {
    $table->dropForeign(['utilisateur_id']);
});
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
