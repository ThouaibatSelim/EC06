<?php

namespace Tests\Feature;

use Tests\Feature\TestCase;
use App\Models\User;
use App\Models\Formation;
use App\Models\Enrollment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use PHPUnit\Framework\Attributes\Test;

// ─────────────────────────────────────────────────────────────────
// DesinscriptionInactiviteTest.php
// Rôle : teste la commande artisan app:desinscription-inactivite
//        qui désinscrit automatiquement les apprenants inactifs
//        depuis plus de 30 jours
//
// Pour lancer : php artisan test --filter DesinscriptionInactiviteTest
// ─────────────────────────────────────────────────────────────────
class DesinscriptionInactiviteTest extends TestCase
{
    // ─────────────────────────────────────────────────────────
    // Test principal exigé par le sujet : une inscription avec
    // last_activity_at à 31 jours → désinscription effective
    // après exécution de la commande
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function une_inscription_inactive_depuis_31_jours_est_supprimee()
    {
        $apprenant = User::factory()->apprenant()->create();
        $formation = Formation::factory()->create();

        $enrollment = Enrollment::create([
            'utilisateur_id'    => $apprenant->id,
            'formation_id'      => $formation->id,
            'progression'       => 20,
            'last_activity_at'  => Carbon::now()->subDays(31),
        ]);

        Artisan::call('app:desinscription-inactivite');

        $this->assertDatabaseMissing('enrollments', [
            'id' => $enrollment->id,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    // Une inscription active récemment (< 30 jours) ne doit
    // pas être supprimée
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function une_inscription_active_recemment_n_est_pas_supprimee()
    {
        $apprenant = User::factory()->apprenant()->create();
        $formation = Formation::factory()->create();

        $enrollment = Enrollment::create([
            'utilisateur_id'    => $apprenant->id,
            'formation_id'      => $formation->id,
            'progression'       => 50,
            'last_activity_at'  => Carbon::now()->subDays(5),
        ]);

        Artisan::call('app:desinscription-inactivite');

        $this->assertDatabaseHas('enrollments', [
            'id' => $enrollment->id,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    // Une inscription sans last_activity_at (jamais d'activité
    // enregistrée) est aussi considérée inactive
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function une_inscription_sans_activite_enregistree_est_supprimee()
    {
        $apprenant = User::factory()->apprenant()->create();
        $formation = Formation::factory()->create();

        $enrollment = Enrollment::create([
            'utilisateur_id'    => $apprenant->id,
            'formation_id'      => $formation->id,
            'progression'       => 0,
            'last_activity_at'  => null,
        ]);

        Artisan::call('app:desinscription-inactivite');

        $this->assertDatabaseMissing('enrollments', [
            'id' => $enrollment->id,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    // La commande retourne un message explicite avec le nombre
    // de désinscriptions effectuées
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function la_commande_affiche_le_nombre_de_desinscriptions()
    {
        $apprenant = User::factory()->apprenant()->create();
        $formation = Formation::factory()->create();

        Enrollment::create([
            'utilisateur_id'    => $apprenant->id,
            'formation_id'      => $formation->id,
            'progression'       => 0,
            'last_activity_at'  => Carbon::now()->subDays(45),
        ]);

        $exitCode = Artisan::call('app:desinscription-inactivite');
        $output = Artisan::output();

        $this->assertEquals(0, $exitCode);
        $this->assertStringContainsString('1 inscription(s) supprimée(s)', $output);
    }
}
