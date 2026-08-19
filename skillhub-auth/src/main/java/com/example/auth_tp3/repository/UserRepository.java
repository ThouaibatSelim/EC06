package com.example.auth_tp3.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.auth_tp3.entity.User;

// ─────────────────────────────────────────────────────────────────
// UserRepository.java
// Rôle : accès aux données de la table "users" en MySQL
//
// JpaRepository fournit automatiquement les opérations CRUD
// de base sans écrire une seule ligne de SQL :
//   - save(user)        → INSERT ou UPDATE
//   - findById(id)      → SELECT WHERE id = ?
//   - findAll()         → SELECT * FROM users
//   - delete(user)      → DELETE WHERE id = ?
//   - count()           → SELECT COUNT(*)
//
// On étend JpaRepository<User, Long> :
//   - User : l'entité mappée sur la table
//   - Long : le type de la clé primaire (id)
// ─────────────────────────────────────────────────────────────────

// @Repository indique à Spring Boot que cette interface
// est un composant d'accès aux données — elle sera
// instanciée automatiquement et injectable via constructeur
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Spring Data JPA génère automatiquement la requête SQL
    // à partir du nom de la méthode — pas besoin d'écrire le SQL
    //
    // findByEmail → SELECT * FROM users WHERE email = ? LIMIT 1
    //
    // Optional<User> = le résultat peut être null sans exception
    // On utilise orElseThrow() dans AuthService pour gérer
    // le cas où l'email n'existe pas
    Optional<User> findByEmail(String email);

    // existsByEmail → SELECT COUNT(*) FROM users WHERE email = ?
    // Retourne true si au moins un utilisateur a cet email
    // Utilisé dans AuthService.register() pour bloquer
    // les inscriptions avec un email déjà utilisé
    boolean existsByEmail(String email);
}