package com.example.auth_tp3.exception;

// ─────────────────────────────────────────────────────────────────
// AuthenticationFailedException.java
// Rôle : exception métier pour les échecs d'authentification
//
// Lancée par AuthService dans deux cas :
//   - login() : email introuvable en BDD
//   - login() : mot de passe incorrect
//
// Interceptée par GlobalExceptionHandler.java qui la transforme
// en réponse HTTP 401 (Unauthorized) avec un message JSON
//
// On renvoie volontairement le même message dans les deux cas :
// "Email ou mot de passe incorrect"
// → empêche de deviner si un email est enregistré ou non
// ─────────────────────────────────────────────────────────────────

// RuntimeException = exception non vérifiée (unchecked)
// Pas besoin de la déclarer avec "throws" dans les signatures
// de méthodes — elle se propage automatiquement jusqu'au
// GlobalExceptionHandler
public class AuthenticationFailedException extends RuntimeException {

    public AuthenticationFailedException(String message) {
        // On passe le message à RuntimeException
        // récupérable via getMessage() dans le handler
        super(message);
    }
}