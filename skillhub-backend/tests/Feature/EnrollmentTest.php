<?php

namespace Tests\Feature;

use Tests\Feature\TestCase;
use App\Models\User;
use App\Models\Formation;
use App\Models\Enrollment;
use Tymon\JWTAuth\Facades\JWTAuth;
use PHPUnit\Framework\Attributes\Test;

// ─────────────────────────────────────────────────────────────────
// EnrollmentTest.php
// Rôle : tests de la règle métier "5 formations actives maximum"
//        sur EnrollmentController::store()
//
// Pour lancer : php artisan test --filter EnrollmentTest
// ─────────────────────────────────────────────────────────────────
class EnrollmentTest extends TestCase
{
    private function getToken(User $user): string
    {
        return JWTAuth::fromUser($user);
    }

    // ─────────────────────────────────────────────────────────
    // Test 1 : un apprenant avec 4 inscriptions actives peut
    // encore s'inscrire à une 5ème formation
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function un_apprenant_peut_s_inscrire_jusqu_a_la_5eme_formation()
    {
        $apprenant = User::factory()->apprenant()->create();
        $this->fakeSpringBoot('apprenant', $apprenant->id, $apprenant->email);
        $token = $this->getToken($apprenant);

        // 4 inscriptions existantes
        $formationsExistantes = Formation::factory()->count(4)->create();
        foreach ($formationsExistantes as $formation) {
            Enrollment::create([
                'utilisateur_id' => $apprenant->id,
                'formation_id'   => $formation->id,
                'progression'    => 0,
            ]);
        }

        $nouvelleFormation = Formation::factory()->create();

        $response = $this->postJson(
            "/api/formations/{$nouvelleFormation->id}/inscription",
            [],
            ['Authorization' => "Bearer $token"]
        );

        $response->assertStatus(201);

        $this->assertDatabaseHas('enrollments', [
            'utilisateur_id' => $apprenant->id,
            'formation_id'   => $nouvelleFormation->id,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    // Test 2 : un apprenant déjà inscrit à 5 formations ne peut
    // pas s'inscrire à une 6ème → 400
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function un_apprenant_ne_peut_pas_depasser_5_formations_actives()
    {
        $apprenant = User::factory()->apprenant()->create();
        $this->fakeSpringBoot('apprenant', $apprenant->id, $apprenant->email);
        $token = $this->getToken($apprenant);

        // 5 inscriptions existantes (limite déjà atteinte)
        $formationsExistantes = Formation::factory()->count(5)->create();
        foreach ($formationsExistantes as $formation) {
            Enrollment::create([
                'utilisateur_id' => $apprenant->id,
                'formation_id'   => $formation->id,
                'progression'    => 0,
            ]);
        }

        $sixiemeFormation = Formation::factory()->create();

        $response = $this->postJson(
            "/api/formations/{$sixiemeFormation->id}/inscription",
            [],
            ['Authorization' => "Bearer $token"]
        );

        $response->assertStatus(400)
            ->assertJsonStructure(['message']);

        // La 6ème inscription ne doit pas exister en base
        $this->assertDatabaseMissing('enrollments', [
            'utilisateur_id' => $apprenant->id,
            'formation_id'   => $sixiemeFormation->id,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    // Test 3 : se désinscrire libère un slot, une 6ème
    // inscription redevient possible
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function se_desinscrire_libere_un_slot_pour_une_nouvelle_inscription()
    {
        $apprenant = User::factory()->apprenant()->create();
        $this->fakeSpringBoot('apprenant', $apprenant->id, $apprenant->email);
        $token = $this->getToken($apprenant);

        $formationsExistantes = Formation::factory()->count(5)->create();
        foreach ($formationsExistantes as $formation) {
            Enrollment::create([
                'utilisateur_id' => $apprenant->id,
                'formation_id'   => $formation->id,
                'progression'    => 0,
            ]);
        }

        // Désinscription d'une formation existante
        $this->deleteJson(
            "/api/formations/{$formationsExistantes[0]->id}/inscription",
            [],
            ['Authorization' => "Bearer $token"]
        )->assertStatus(200);

        $nouvelleFormation = Formation::factory()->create();

        $response = $this->postJson(
            "/api/formations/{$nouvelleFormation->id}/inscription",
            [],
            ['Authorization' => "Bearer $token"]
        );

        $response->assertStatus(201);
    }
}
