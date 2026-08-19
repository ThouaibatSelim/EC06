<?php

namespace Tests\Feature;

use Tests\Feature\TestCase;
use App\Models\User;
use App\Models\Formation;
use Tymon\JWTAuth\Facades\JWTAuth;
use PHPUnit\Framework\Attributes\Test;

// ─────────────────────────────────────────────────────────────────
// SecuriteTest.php
// Rôle : tests de sécurité et de contrôle d'accès
//
// Vérifie que les règles de permissions sont bien appliquées :
//   - utilisateur non authentifié → 401
//   - mauvais rôle → 403
//   - formateur modifie la formation d'un autre → 403
//
// Hérite de Tests\Feature\TestCase qui fournit :
//   - RefreshDatabase (BDD SQLite remise à zéro entre chaque test)
//   - fakeSpringBoot() (simule les réponses de Spring Boot)
//
// Pour lancer : php artisan test --filter SecuriteTest
// ─────────────────────────────────────────────────────────────────
class SecuriteTest extends TestCase
{
    private function getToken(User $user): string
    {
        return JWTAuth::fromUser($user);
    }


    // ─────────────────────────────────────────────────────────
    // Test 1 : sans token → 401
    // Un visiteur non connecté ne peut pas créer de formation
    // Aucun fakeSpringBoot() ici — le middleware bloque
    // avant même d'appeler Spring Boot (header manquant)
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function un_utilisateur_non_authentifie_ne_peut_pas_creer_une_formation()
    {
        $response = $this->postJson('/api/formations', [
            'titre'       => 'Formation test',
            'description' => 'Description test',
            'categorie'   => 'Design',
            'niveau'      => 'Débutant',
        ]);

        // 401 = token manquant (géré par JwtVerifyMiddleware)
        $response->assertStatus(401);
    }


    // ─────────────────────────────────────────────────────────
    // Test 2 : apprenant tente de créer une formation → 403
    // Vérifie que le middleware role:formateur bloque
    // un utilisateur avec le rôle apprenant
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function un_apprenant_ne_peut_pas_creer_une_formation()
    {
        $apprenant = User::factory()->create(['role' => 'apprenant']);
        $this->fakeSpringBoot('apprenant', $apprenant->id, $apprenant->email);
        $token = $this->getToken($apprenant);

        $response = $this->postJson('/api/formations', [
            'titre'       => 'Formation test',
            'description' => 'Description test',
            'categorie'   => 'Design',
            'niveau'      => 'Débutant',
        ], ['Authorization' => "Bearer $token"]);

        // 403 = authentifié mais rôle insuffisant
        // (géré par CheckRole middleware)
        $response->assertStatus(403);
    }


    // ─────────────────────────────────────────────────────────
    // Test 3 : formateur modifie la formation d'un autre → 403
    // Vérifie la vérification de propriété dans update()
    // Spring Boot identifie formateur2 — mais la formation
    // appartient à formateur1 → 403 dans le controller
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function un_formateur_ne_peut_pas_modifier_la_formation_dun_autre()
    {
        $formateur1 = User::factory()->create(['role' => 'formateur']);
        $formateur2 = User::factory()->create(['role' => 'formateur']);

        // Spring Boot identifie formateur2 (celui qui fait la requête)
        $this->fakeSpringBoot('formateur', $formateur2->id, $formateur2->email);
        $token2 = $this->getToken($formateur2);

        // Formation appartenant à formateur1
        $formation = Formation::factory()->create([
            'formateur_id' => $formateur1->id,
        ]);

        // Formateur2 tente de modifier la formation de formateur1
        $response = $this->putJson("/api/formations/{$formation->id}", [
            'titre'       => 'Tentative de modification',
            'description' => $formation->description,
            'categorie'   => $formation->categorie,
            'niveau'      => $formation->niveau,
        ], ['Authorization' => "Bearer $token2"]);

        // 403 = vérifié dans FormationController.update()
        $response->assertStatus(403);
    }


    // ─────────────────────────────────────────────────────────
    // Test 4 : profil sans token → 401
    // Vérifie que /api/profile est bien protégé
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function un_utilisateur_non_authentifie_ne_peut_pas_voir_son_profil()
    {
        $response = $this->getJson('/api/profile');

        $response->assertStatus(401);
    }


    // ─────────────────────────────────────────────────────────
    // Test 5 : apprenant accède au dashboard formateur → 403
    // Vérifie que /api/formateur/formations est réservé
    // aux formateurs uniquement
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function un_apprenant_ne_peut_pas_acceder_au_dashboard_formateur()
    {
        $apprenant = User::factory()->create(['role' => 'apprenant']);
        $this->fakeSpringBoot('apprenant', $apprenant->id, $apprenant->email);
        $token = $this->getToken($apprenant);

        $response = $this->getJson('/api/formateur/formations', [
            'Authorization' => "Bearer $token",
        ]);

        // 403 = authentifié mais rôle apprenant insuffisant
        $response->assertStatus(403);
    }
}