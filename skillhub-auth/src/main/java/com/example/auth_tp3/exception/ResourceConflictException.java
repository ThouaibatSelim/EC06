package com.example.auth_tp3.exception;

// ─────────────────────────────────────────────────────────────────
// ResourceConflictException.java
// Rôle : exception métier pour les conflits de ressources
//
// Lancée par AuthService dans ce cas :
//   - register() : un utilisateur avec cet email existe déjà
//
// Interceptée par GlobalExceptionHandler qui la transforme
// en réponse HTTP 409 (Conflict)
//
// 409 est plus précis que 400 — il indique que la requête
// est valide mais entre en conflit avec l'état actuel
// de la ressource en base de données
// ─────────────────────────────────────────────────────────────────
public class ResourceConflictException extends RuntimeException {

    public ResourceConflictException(String message) {
        super(message);
    }
}