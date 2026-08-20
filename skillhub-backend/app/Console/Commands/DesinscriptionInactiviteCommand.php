<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Enrollment;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

// ─────────────────────────────────────────────────────────────────
// DesinscriptionInactiviteCommand.php
// Rôle : désinscrit automatiquement les apprenants inactifs
//        depuis plus de 30 jours de toutes leurs formations
//        en cours
//
// Un apprenant est considéré inactif si :
//   - last_activity_at est NULL (jamais eu d'activité enregistrée)
//   - OU last_activity_at date de plus de 30 jours
//
// Usage : php artisan app:desinscription-inactivite
// (à planifier périodiquement via le scheduler Laravel en prod)
// ─────────────────────────────────────────────────────────────────
class DesinscriptionInactiviteCommand extends Command
{
    protected $signature = 'app:desinscription-inactivite';

    protected $description = 'Désinscrit les apprenants inactifs depuis plus de 30 jours de leurs formations en cours';

    public function handle(): int
    {
        $seuilInactivite = Carbon::now()->subDays(30);

        $inscriptionsInactives = Enrollment::where(function ($query) use ($seuilInactivite) {
            $query->whereNull('last_activity_at')
                  ->orWhere('last_activity_at', '<', $seuilInactivite);
        });

        $nombreDesinscriptions = $inscriptionsInactives->count();

        $inscriptionsInactives->delete();

        $message = "Désinscription automatique effectuée : {$nombreDesinscriptions} inscription(s) supprimée(s) pour inactivité (> 30 jours).";

        $this->info($message);
        Log::info($message);

        return self::SUCCESS;
    }
}
