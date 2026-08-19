package com.example.auth_tp3.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

// ─────────────────────────────────────────────────────────────────
// User.java
// Rôle : représente la table "users" en base de données
//
// C'est une entité JPA — chaque instance de cette classe
// correspond à une ligne dans la table MySQL "users".
//
// Cette table est partagée entre Spring Boot et Laravel :
//   - Spring Boot : gère l'authentification (register, login)
//   - Laravel     : lit les utilisateurs pour les formations,
//                   inscriptions, etc.
//
// ⚠️  Les noms des colonnes doivent correspondre exactement
//     à la migration Laravel (created_at, updated_at, etc.)
// ─────────────────────────────────────────────────────────────────

// @Data génère via Lombok : getters, setters,
// toString(), equals(), hashCode()
@Data

// @Entity indique à JPA que cette classe est mappée
// sur une table en base de données
@Entity

// @Table précise le nom exact de la table MySQL
// Sans cette annotation, JPA utiliserait "user" par défaut
// ce qui est un mot réservé en SQL — toujours le préciser
@Table(name = "users")
public class User {

    // ── Clé primaire ──────────────────────────────────────────
    // @Id désigne ce champ comme clé primaire
    // @GeneratedValue avec IDENTITY = auto-increment MySQL
    // (équivalent du bigIncrements() dans Laravel)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Champs obligatoires ───────────────────────────────────
    // nullable = false = contrainte NOT NULL en base
    // Spring Boot lèvera une exception si ces champs
    // sont null lors d'un save()

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    // unique = true = contrainte UNIQUE en base
    // Empêche deux utilisateurs d'avoir le même email
    // AuthService vérifie aussi via existsByEmail()
    // avant d'arriver ici — double protection
    @Column(nullable = false, unique = true)
    private String email;

    // Mot de passe toujours stocké hashé — jamais en clair
    // Le hashage est fait dans AuthService via EncryptionService
    // avant d'appeler user.setPassword()
    @Column(nullable = false)
    private String password;

    // Deux valeurs possibles : "apprenant" ou "formateur"
    // Encodé dans le token JWT pour que Laravel puisse
    // vérifier les permissions sans requête BDD supplémentaire
    @Column(nullable = false)
    private String role;

    // ── Timestamps ────────────────────────────────────────────
    // name = "created_at" et "updated_at" correspondent aux
    // colonnes générées automatiquement par Laravel dans
    // ses migrations — important pour la compatibilité
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Callbacks JPA ─────────────────────────────────────────
    // @PrePersist : exécuté automatiquement par JPA juste
    // AVANT un INSERT en base (équivalent du creating() Laravel)
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    // @PreUpdate : exécuté automatiquement par JPA juste
    // AVANT un UPDATE en base (équivalent du updating() Laravel)
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}