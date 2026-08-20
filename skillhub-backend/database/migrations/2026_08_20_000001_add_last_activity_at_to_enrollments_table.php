<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// ─────────────────────────────────────────────────────────────────
// Ajoute last_activity_at à enrollments : sert à détecter les
// apprenants inactifs depuis plus de 30 jours (désinscription
// automatique).
//
// Schema::hasColumn() fait office de "IF NOT EXISTS" — Laravel
// n'a pas de syntaxe native pour ça sur MySQL, donc on vérifie
// nous-mêmes avant d'ajouter la colonne, pour que la migration
// soit rejouable sans erreur si elle a déjà été appliquée.
// ─────────────────────────────────────────────────────────────────
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('enrollments', 'last_activity_at')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->dateTime('last_activity_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('enrollments', 'last_activity_at')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->dropColumn('last_activity_at');
            });
        }
    }
};
