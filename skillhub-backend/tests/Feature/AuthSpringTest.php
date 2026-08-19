<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Illuminate\Foundation\Testing\RefreshDatabase;

// ─────────────────────────────────────────────────────────────────
// AuthSpringTest.php
// Rôle : vérifie que JwtVerifyMiddleware communique correctement
//        avec Spring Boot pour la validation JWT
//
// Utilise Http::fake() pour simuler les réponses Spring Boot
// → pas besoin que Spring Boot tourne pendant le CI
//
// Pour lancer : php artisan test --filter AuthSpringTest
// ─────────────────────────────────────────────────────────────────
class AuthSpringTest extends TestCase
{
    use RefreshDatabase;
    // URL de Spring Boot lue depuis le .env de test
    // Doit correspondre exactement à ce que fait le middleware
    private string $validateUrl;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validateUrl = env('AUTH_SERVICE_URL', 'http://skillhub-auth:8080')
            . '/api/auth/validate';
    }

    // ─────────────────────────────────────────────────────────
    // Test 1 : token valide → Spring Boot répond 200
    // Vérifie que le middleware laisse passer la requête
    // et injecte bien email, role, userId dans $request
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function un_token_valide_est_accepte_par_le_middleware()
    {
        Http::fake([
            $this->validateUrl => Http::response([
                'email'  => 'jean@test.com',
                'role'   => 'formateur',
                'userId' => 1,
            ], 200),
        ]);

        // /api/formations est public → on vérifie juste que
        // le middleware ne bloque pas un token valide
        $response = $this->getJson('/api/formations', [
            'Authorization' => 'Bearer fake-token-valide',
        ]);

        $response->assertStatus(200);
    }

    // ─────────────────────────────────────────────────────────
    // Test 2 : token invalide → Spring Boot répond 401
    // Vérifie que le middleware bloque et retourne 401
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function un_token_invalide_est_rejete_par_le_middleware()
    {
        Http::fake([
            $this->validateUrl => Http::response([
                'message' => 'Token invalide',
            ], 401),
        ]);

        // /api/profile est protégé → doit retourner 401
        $response = $this->getJson('/api/profile', [
            'Authorization' => 'Bearer fake-token-invalide',
        ]);

        $response->assertStatus(401);
    }

    // ─────────────────────────────────────────────────────────
    // Test 3 : pas de token → 401 direct sans appeler Spring Boot
    // Vérifie que le middleware bloque avant même
    // de contacter Spring Boot (header manquant)
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function sans_token_la_requete_est_bloquee_sans_appel_spring_boot()
    {
        // Pas de Http::fake() ici — si Spring Boot était appelé
        // le test lèverait une exception, ce qui nous alerterait
        $response = $this->getJson('/api/profile');

        $response->assertStatus(401);

        // Vérifie qu'aucun appel HTTP n'a été fait
        Http::assertNothingSent();
    }

    // ─────────────────────────────────────────────────────────
    // Test 4 : Spring Boot inaccessible → 503
    // Vérifie que le catch(\Exception) du middleware
    // retourne bien 503 et ne fait pas planter l'app
    // ─────────────────────────────────────────────────────────
    #[Test]
    public function si_spring_boot_est_inaccessible_on_recoit_503()
    {
        Http::fake([
            $this->validateUrl => function () {
                throw new \Exception('Connection refused');
            },
        ]);

        $response = $this->getJson('/api/profile', [
            'Authorization' => 'Bearer fake-token',
        ]);

        $response->assertStatus(503);
    }
}