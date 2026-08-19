package com.example.auth_tp3.exception;

// ─────────────────────────────────────────────────────────────────
// InvalidInputException.java
// Rôle : exception métier pour les données invalides envoyées
//        par le client
//
// Lancée par AuthService dans ces cas :
//   - email null ou sans "@"
//   - mot de passe de moins de 12 caractères
//   - rôle différent de "apprenant" ou "formateur"
//
// Interceptée par GlobalExceptionHandler qui la transforme
// en réponse HTTP 400 (Bad Request)
// ─────────────────────────────────────────────────────────────────
public class InvalidInputException extends RuntimeException {

    public InvalidInputException(String message) {
        super(message);
    }
}