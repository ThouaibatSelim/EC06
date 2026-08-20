<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Http\Request;

// ─────────────────────────────────────────────────────────────────
// bootstrap/app.php
// Rôle : point d'entrée et configuration globale de Laravel
//
// C'est ici que Laravel est configuré au démarrage :
//   - les fichiers de routes à charger
//   - les alias de middleware disponibles dans les routes
//   - le comportement en cas d'exception
//
// Dans la V2 SkillHub, ce fichier est crucial car c'est ici
// qu'on enregistre jwt.verify et role — sans ces alias,
// les routes protégées ne fonctionnent pas
// ─────────────────────────────────────────────────────────────────

return Application::configure(basePath: dirname(__DIR__))

    // ── Fichiers de routes ────────────────────────────────────
    // Laravel charge automatiquement ces fichiers au démarrage
    //   web.php     → routes avec session/cookies (pages HTML)
    //   api.php     → routes REST préfixées par /api
    //   console.php → commandes artisan personnalisées
    //   health      → endpoint /up pour les health checks Docker
    ->withRouting(
        web:      __DIR__ . '/../routes/web.php',
        api:      __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health:   '/up',
    )

    ->withMiddleware(function (Middleware $middleware) {

        // ── Alias de middleware ───────────────────────────────
        // Permet d'utiliser des noms courts dans les routes
        // au lieu des noms de classe complets.
        //
        // Utilisation dans api.php :
        //   Route::middleware(['jwt.verify'])         → vérifie le JWT
        //   Route::middleware(['jwt.verify', 'role:formateur']) → JWT + rôle
        $middleware->alias([
            // Vérifie le token JWT via Spring Boot
            // et injecte auth_user_id, auth_user_role, auth_user_email
            'jwt.verify' => \App\Http\Middleware\JwtVerifyMiddleware::class,

            // Vérifie que l'utilisateur a le bon rôle
            // Usage : 'role:formateur' ou 'role:apprenant'
            'role'       => \App\Http\Middleware\CheckRole::class,
        ]);

        // ── Redirection des invités ───────────────────────────
        // Par défaut Laravel redirige vers /login si non connecté
        // On retourne null pour renvoyer une réponse JSON 401
        // à la place d'une redirection HTML — indispensable
        // pour une API REST consommée par React
        $middleware->redirectGuestsTo(function (Request $request) {
            return null;
        });
    })

    // ── Gestion des exceptions globales ──────────────────────
    // Peut être utilisé pour personnaliser les réponses
    // d'erreur globales (ex: 404, 500...)
    // Laissé vide car GlobalExceptionHandler.java gère
    // les erreurs côté Spring Boot et les controllers
    // Laravel gèrent leurs propres erreurs localement
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();