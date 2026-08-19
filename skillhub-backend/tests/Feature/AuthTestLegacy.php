<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\Group;

// ─────────────────────────────────────────────────────────────────
// AuthTest.php — LEGACY V1
// Routes /api/register et /api/login migrées vers Spring Boot (V2)
// Cette classe est désactivée du pipeline CI (groupe "legacy")
// La couverture CDC auth est assurée par SecuriteTest.php
//
// Pour lancer manuellement : php artisan test --group legacy
// ─────────────────────────────────────────────────────────────────
#[Group('legacy')]
class AuthTestLegacy extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────────────────
    // Test 1 : inscription réussie
    // Vérifie qu'un utilisateur peut créer un compte
    // et que les données sont bien persistées en BDD
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function un_utilisateur_peut_sinscrire()
    {
        $response = $this->postJson('/api/register', [
            'nom'      => 'Dupont',
            'prenom'   => 'Jean',
            'email'    => 'jean@test.com',
            'password' => 'password123',
            'role'     => 'apprenant',
        ]);

        // assertStatus(201) → création réussie
        // assertJsonStructure → vérifie les clés présentes
        // sans vérifier les valeurs exactes
        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'user' => ['id', 'nom', 'prenom', 'email', 'role'],
                     'token',
                 ]);

        // Vérifie que l'utilisateur existe réellement en BDD
        $this->assertDatabaseHas('users', [
            'email' => 'jean@test.com',
            'role'  => 'apprenant',
        ]);
    }


    // ─────────────────────────────────────────────────────────
    // Test 2 : connexion réussie
    // Vérifie qu'un utilisateur existant peut se connecter
    // et recevoir un token JWT
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function un_utilisateur_peut_se_connecter()
    {
        // Crée un utilisateur directement en BDD via factory
        // bcrypt() hashe le mot de passe comme le ferait
        // l'application en production
        $user = User::factory()->create([
            'email'    => 'jean@test.com',
            'password' => bcrypt('password123'),
            'role'     => 'apprenant',
        ]);

        $response = $this->postJson('/api/login', [
            'email'    => 'jean@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'message',
                     'user',
                     'token',
                 ]);
    }


    // ─────────────────────────────────────────────────────────
    // Test 3 : connexion échoue avec mauvais mot de passe
    // Vérifie que l'API renvoie 401 et non 200 ou 500
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function connexion_echoue_avec_mauvais_mot_de_passe()
    {
        User::factory()->create([
            'email'    => 'jean@test.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email'    => 'jean@test.com',
            'password' => 'mauvaismdp', // ← mot de passe incorrect
        ]);

        // 401 Unauthorized = identifiants incorrects
        $response->assertStatus(401);
    }


    // ─────────────────────────────────────────────────────────
    // Test 4 : email déjà utilisé
    // Vérifie qu'on ne peut pas créer deux comptes
    // avec le même email
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function inscription_echoue_si_email_deja_utilise()
    {
        // Premier utilisateur créé avec cet email
        User::factory()->create(['email' => 'jean@test.com']);

        // Deuxième tentative avec le même email
        $response = $this->postJson('/api/register', [
            'nom'      => 'Dupont',
            'prenom'   => 'Jean',
            'email'    => 'jean@test.com', // ← email déjà pris
            'password' => 'password123',
            'role'     => 'apprenant',
        ]);

        // 422 Unprocessable Entity = validation échouée
        $response->assertStatus(422);
    }
}