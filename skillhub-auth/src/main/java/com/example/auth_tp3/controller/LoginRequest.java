// ─────────────────────────────────────────────────────────────────
// LoginRequest.java
// Rôle : représente le corps de la requête POST /api/auth/login
//
// Ce fichier est un DTO (Data Transfer Object) — son seul rôle
// est de transporter les données reçues depuis React vers
// AuthController, sans aucune logique métier.
//
// ⚠️  À déplacer dans le dossier dto/ avant le rendu final
//     package com.example.auth_tp3.dto
// ─────────────────────────────────────────────────────────────────
package com.example.auth_tp3.controller; // ⚠️ devrait être .dto

// @Data est une annotation Lombok qui génère automatiquement
// à la compilation :
//   - les getters  (getEmail(), getPassword())
//   - les setters  (setEmail(), setPassword())
//   - toString(), equals(), hashCode()
// Sans Lombok il faudrait écrire toutes ces méthodes à la main
import lombok.Data;

@Data
public class LoginRequest {

    // Ces deux champs correspondent exactement aux clés JSON
    // envoyées par React dans AuthContext.jsx :
    // { "email": "...", "password": "..." }
    // Spring Boot les mappe automatiquement grâce à @RequestBody
    private String email;
    private String password;
}