// ─────────────────────────────────────────────────────────────────
// config/api.js
// Rôle : centralise toutes les URLs de l'application
//
// Avantage : si un port change (ex: Spring Boot passe de 8080
// à 8081), on ne modifie qu'ici au lieu de chercher dans
// tous les fichiers
// ─────────────────────────────────────────────────────────────────

// Spring Boot — service d'authentification
export const SPRING_BOOT_URL = "http://localhost:8080/api/auth";

// Laravel — API métier (formations, modules, inscriptions)
export const LARAVEL_URL = "http://localhost:8000/api";

// Endpoints précis — pratique pour éviter les fautes de frappe
// sur les chaînes de routes utilisées fréquemment
export const ENDPOINTS = {
    LOGIN:      `${SPRING_BOOT_URL}/login`,
    REGISTER:   `${SPRING_BOOT_URL}/register`,
    FORMATIONS: `${LARAVEL_URL}/formations`,
};