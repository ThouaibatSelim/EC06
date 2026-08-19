<?php

namespace Tests\Feature;

use Tests\TestCase;

// ─────────────────────────────────────────────────────────────────
// ExampleTest.php
// Rôle : test de smoke basique — vérifie que l'application
//        démarre et répond correctement
//
// C'est le test minimal fourni par Laravel.
// Il vérifie que la route "/" retourne un 200.
// Utile pour détecter les erreurs de configuration globales.
//
// Pour lancer : php artisan test --filter ExampleTest
// ─────────────────────────────────────────────────────────────────
class ExampleTest extends TestCase
{
    // Test de smoke : vérifie que l'app répond sur "/"
    // Si ce test échoue, c'est un problème de configuration
    // global (BDD inaccessible, .env manquant, etc.)
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}