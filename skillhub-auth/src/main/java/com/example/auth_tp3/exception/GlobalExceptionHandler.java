package com.example.auth_tp3.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletRequest;

// ─────────────────────────────────────────────────────────────────
// GlobalExceptionHandler.java
// Rôle : intercepte toutes les exceptions de l'application
//        et les transforme en réponses JSON cohérentes
//
// Sans ce fichier, Spring Boot renverrait des erreurs Java
// incompréhensibles pour le client (stack trace en HTML).
// Avec ce fichier, toutes les erreurs ont exactement
// le même format JSON :
// {
//   "timestamp" : "2026-04-19T10:30:00",
//   "status"    : 401,
//   "error"     : "Unauthorized",
//   "message"   : "Email ou mot de passe incorrect",
//   "path"      : "/api/auth/login"
// }
// ─────────────────────────────────────────────────────────────────

// @RestControllerAdvice = surveille tous les controllers
// et intercepte leurs exceptions avant qu'elles
// remontent au client
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ─────────────────────────────────────────────────────────
    // Construction de la réponse d'erreur
    //
    // Méthode privée réutilisée par tous les handlers
    // pour garantir un format de réponse uniforme
    // ─────────────────────────────────────────────────────────
    private Map<String, Object> buildError(HttpStatus status,
                                           String message,
                                           HttpServletRequest request) {
        Map<String, Object> error = new HashMap<>();

        // Horodatage de l'erreur — utile pour les logs
        error.put("timestamp", LocalDateTime.now().toString());

        // Code HTTP numérique (400, 401, 409...)
        error.put("status",    status.value());

        // Texte standard du code HTTP ("Bad Request", "Unauthorized"...)
        error.put("error",     status.getReasonPhrase());

        // Notre message personnalisé défini dans l'exception
        error.put("message",   message);

        // URL qui a déclenché l'erreur — aide au débogage
        error.put("path",      request.getRequestURI());

        return error;
    }


    // ─────────────────────────────────────────────────────────
    // 400 Bad Request
    // Données envoyées invalides (email, password, role)
    // Lancée par : AuthService.register()
    // ─────────────────────────────────────────────────────────
    @ExceptionHandler(InvalidInputException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidInput(
            InvalidInputException ex,
            HttpServletRequest request) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildError(HttpStatus.BAD_REQUEST, ex.getMessage(), request));
    }


    // ─────────────────────────────────────────────────────────
    // 401 Unauthorized
    // Email introuvable ou mot de passe incorrect
    // Lancée par : AuthService.login()
    // ─────────────────────────────────────────────────────────
    @ExceptionHandler(AuthenticationFailedException.class)
    public ResponseEntity<Map<String, Object>> handleAuthFailed(
            AuthenticationFailedException ex,
            HttpServletRequest request) {

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(buildError(HttpStatus.UNAUTHORIZED, ex.getMessage(), request));
    }


    // ─────────────────────────────────────────────────────────
    // 409 Conflict
    // Email déjà utilisé lors d'une inscription
    // Lancée par : AuthService.register()
    // ─────────────────────────────────────────────────────────
    @ExceptionHandler(ResourceConflictException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(
            ResourceConflictException ex,
            HttpServletRequest request) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(buildError(HttpStatus.CONFLICT, ex.getMessage(), request));
    }
}