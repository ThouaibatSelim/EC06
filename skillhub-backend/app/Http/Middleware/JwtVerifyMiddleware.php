<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

// ─────────────────────────────────────────────────────────────────
// JwtVerifyMiddleware.php
// Rôle : vérifie le token JWT sur chaque requête protégée
//
// C'est la pièce centrale de l'architecture V2 :
// Laravel ne gère plus l'auth — il délègue à Spring Boot.
//
// Fonctionnement sur chaque requête protégée :
//   1. Lit le header Authorization: Bearer <token>
//   2. Envoie le token à Spring Boot /api/auth/validate
//   3. Spring Boot vérifie la signature et l'expiration
//   4. Si valide → injecte email, role, userId dans $request
//   5. Si invalide → bloque avec 401
//
// Les controllers accèdent ensuite aux données via :
//   $request->auth_user_id
//   $request->auth_user_email
//   $request->auth_user_role
// ─────────────────────────────────────────────────────────────────
class JwtVerifyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // ── Lecture du header Authorization ───────────────────
        // Le token JWT est envoyé par React dans chaque requête :
        // Authorization: Bearer eyJhbGci...
        $authHeader = $request->header('Authorization');

        // Vérifie que le header est présent ET commence par "Bearer "
        // str_starts_with() est plus lisible que strpos() === 0
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'message' => 'Token manquant',
            ], 401);
        }

        // Extraction du token — on retire les 7 premiers caractères
        // "Bearer " (avec l'espace) pour ne garder que le JWT
        $token = substr($authHeader, 7);


        // ── Mode simulation ────────────────────────────────────
        // Permet de tester Laravel sans Spring Boot démarré.
        // Pour activer : remplacer "false" par
        // env('AUTH_SIMULATION', false) et mettre
        // AUTH_SIMULATION=true dans le .env
        //
        // ⚠️  Ne jamais activer en production
        if (false) {
            $payload = [
                'email'  => 'test@test.com',
                'role'   => 'formateur', // changer en 'apprenant' pour tester
                'userId' => 1,
            ];

        } else {

            // ── Mode réel : validation via Spring Boot ─────────
            // On appelle l'endpoint /api/auth/validate de Spring Boot
            // qui vérifie la signature JWT et retourne le payload
            try {
                $response = Http::timeout(5)->post(
                    // En local : Spring Boot tourne sur 127.0.0.1:8080
                    // En Docker : remplacer par http://skillhub-auth:8080
                    env('AUTH_SERVICE_URL', 'http://skillhub-auth:8080') . '/api/auth/validate',
                    ['token' => $token]
                );

                // Spring Boot renvoie 401 si token invalide ou expiré
                if (!$response->successful()) {
                    return response()->json([
                        'message' => 'Token invalide ou expiré',
                    ], 401);
                }

                // Payload décodé retourné par Spring Boot :
                // { "email": "...", "role": "...", "userId": ... }
                $payload = $response->json();

            } catch (\Exception $e) {
                // Spring Boot est inaccessible (pas démarré, crash...)
                // 503 Service Unavailable = service tiers indisponible
                return response()->json([
                    'message' => 'Service authentification indisponible',
                ], 503);
            }
        }


        // ── Injection dans la requête ──────────────────────────
        // On ajoute les données de l'utilisateur directement
        // dans l'objet $request pour que tous les controllers
        // y accèdent sans refaire de requête BDD ou appel HTTP
        //
        // Convention de nommage : préfixe "auth_" pour distinguer
        // ces valeurs injectées des données du body de la requête
        $request->merge([
            'auth_user_email' => $payload['email'],
            'auth_user_role'  => $payload['role'],
            'auth_user_id'    => $payload['userId'],
        ]);

        // Passe la requête au controller suivant
        return $next($request);
    }
}