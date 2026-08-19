package com.example.auth_tp3;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

// ─────────────────────────────────────────────────────────────────
// CorsConfig.java
// Rôle : autoriser les requêtes cross-origin vers Spring Boot
//
// Sans ce fichier, React (5173) et Laravel (8000) seraient
// bloqués par le navigateur quand ils appellent Spring Boot
// car ils viennent d'origines (ports) différentes
// ─────────────────────────────────────────────────────────────────
// @Configuration indique à Spring Boot de lire cette classe
// au démarrage et d'enregistrer les beans qu'elle définit
@Configuration
public class CorsConfig {

    // @Bean enregistre cette méthode comme un composant géré
    // par Spring Boot — appliqué automatiquement sur toutes
    // les requêtes HTTP entrantes
    @Bean
    public CorsFilter corsFilter() {

        CorsConfiguration config = new CorsConfiguration();

        // ── Origines autorisées ────────────────────────────────
        // React en développement local (Vite tourne sur 5173)
        // Les deux formes sont nécessaires car le navigateur
        // peut envoyer soit "localhost" soit "127.0.0.1"
        config.addAllowedOrigin("http://localhost:5173");
        config.addAllowedOrigin("http://127.0.0.1:5173");
        config.addAllowedOrigin("http://localhost:3000");   // React Docker
        config.addAllowedOrigin("http://localhost:8000");   // Laravel
        config.addAllowedOrigin("http://localhost:80");     // nginx Docker

        // ⚠️  À ajouter pour le Jour 2 (Docker + Laravel)
        // config.addAllowedOrigin("http://localhost:8000"); // Laravel
        // config.addAllowedOrigin("http://localhost:80");   // nginx Docker
        // ── Méthodes HTTP autorisées ───────────────────────────
        // "*" autorise GET, POST, PUT, DELETE, OPTIONS...
        // OPTIONS est indispensable — c'est la "preflight request"
        // envoyée par le navigateur AVANT chaque requête pour
        // vérifier les permissions CORS
        config.addAllowedMethod("*");

        // ── Headers autorisés ──────────────────────────────────
        // "*" autorise tous les headers, notamment :
        //   Authorization: Bearer <token> ← indispensable pour JWT
        //   Content-Type: application/json
        config.addAllowedHeader("*");

        // ── Credentials ────────────────────────────────────────
        // true = autorise l'envoi du header Authorization
        // ⚠️  Quand setAllowCredentials(true), on ne peut PAS
        // utiliser addAllowedOrigin("*") — il faut lister
        // les origines exactes comme on le fait ci-dessus
        config.setAllowCredentials(true);

        // ── Application sur toutes les routes ──────────────────
        // "/**" = cette config s'applique à toutes les URLs :
        // /api/auth/login, /api/auth/register, /api/auth/validate
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
