// ─────────────────────────────────────────────────────────────────
// RegisterRequest.java
// Rôle : représente le corps de la requête POST /api/auth/register
//
// DTO (Data Transfer Object) — transporte les données du formulaire
// d'inscription React vers AuthController, sans logique métier.
//
// ⚠️  À déplacer dans le dossier dto/ avant le rendu final
//     package com.example.auth_tp3.dto
// ─────────────────────────────────────────────────────────────────
package com.example.auth_tp3.controller; // ⚠️ devrait être .dto

// @Data génère automatiquement via Lombok :
// getters, setters, toString(), equals(), hashCode()
import lombok.Data;

@Data
public class RegisterRequest {

    // Ces champs correspondent exactement aux clés JSON
    // envoyées par React dans RegisterModal.jsx :
    // {
    //   "nom":      "Martin",
    //   "prenom":   "Sophie",
    //   "email":    "sophie@test.com",
    //   "password": "motdepasse",
    //   "role":     "apprenant"
    // }
    private String nom;
    private String prenom;
    private String email;
    private String password;

    // Deux valeurs possibles : "apprenant" ou "formateur"
    // Ce choix détermine le dashboard affiché après connexion
    // et les permissions accordées sur l'API Laravel
    private String role;
}