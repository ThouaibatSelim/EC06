<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase as BaseTestCase;

// ─────────────────────────────────────────────────────────────────
// TestCase.php (Feature)
// Classe de base pour tous les tests Feature qui ont besoin
// d'un token JWT valide.
//
// setUp() intercepte automatiquement les appels vers Spring Boot
// et retourne une réponse simulée valide.
// ─────────────────────────────────────────────────────────────────
class TestCase extends BaseTestCase
{
    use RefreshDatabase;

     // Helper appelé manuellement dans chaque test
    // avec le rôle et l'id de l'utilisateur concerné
    protected function fakeSpringBoot(string $role, int $userId, string $email = 'test@test.com'): void
    {
        Http::fake([
            '*' => Http::response([
                'email'  => $email,
                'role'   => $role,
                'userId' => $userId,
            ], 200),
        ]);
    }
}