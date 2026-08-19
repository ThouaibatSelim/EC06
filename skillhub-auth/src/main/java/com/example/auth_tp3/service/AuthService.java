package com.example.auth_tp3.service;

import org.springframework.stereotype.Service;

import com.example.auth_tp3.entity.User;
import com.example.auth_tp3.exception.AuthenticationFailedException;
import com.example.auth_tp3.exception.InvalidInputException;
import com.example.auth_tp3.exception.ResourceConflictException;
import com.example.auth_tp3.repository.UserRepository;

// ─────────────────────────────────────────────────────────────────
// AuthService.java
// Rôle : contient toute la logique métier de l'authentification
//
// C'est ici que se passent les vraies vérifications :
//   - validation des données (email, password, role)
//   - vérification que l'email n'est pas déjà utilisé
//   - hashage du mot de passe avant sauvegarde
//   - vérification du mot de passe au login
//   - génération du token JWT
//
// AuthController délègue tout le travail à cette classe —
// le controller ne fait que recevoir la requête et renvoyer
// la réponse HTTP
// ─────────────────────────────────────────────────────────────────

// @Service indique à Spring Boot que cette classe est un composant
// métier — elle sera instanciée au démarrage et injectable
// partout via le constructeur
@Service
public class AuthService {

    // ── Injection des dépendances ─────────────────────────────
    private final UserRepository    userRepository;
    private final EncryptionService encryptionService;
    private final JwtService        jwtService;

    public AuthService(UserRepository userRepository,
                       EncryptionService encryptionService,
                       JwtService jwtService) {
        this.userRepository    = userRepository;
        this.encryptionService = encryptionService;
        this.jwtService        = jwtService;
    }


    // ─────────────────────────────────────────────────────────
    // INSCRIPTION
    //
    // Étapes :
    //   1. Validation des données entrantes
    //   2. Vérification que l'email n'existe pas déjà en BDD
    //   3. Hashage du mot de passe (on ne stocke jamais en clair)
    //   4. Sauvegarde de l'utilisateur en BDD
    //   5. Retour de l'entité User persistée
    // ─────────────────────────────────────────────────────────
    public User register(String nom,    String prenom,
                         String email,  String password,
                         String role) throws Exception {

        // ── Validation email ──────────────────────────────────
        // Vérification basique du format — une librairie de
        // validation plus complète pourrait être utilisée
        // mais ceci suffit pour notre cas d'usage
        if (email == null || !email.contains("@")) {
            throw new InvalidInputException("Format d'email invalide");
        }

        // ── Validation mot de passe ───────────────────────────
        // Minimum 12 caractères imposé par le cahier des charges
        if (password == null || password.length() < 12) {
            throw new InvalidInputException(
                "Le mot de passe doit faire au moins 12 caractères"
            );
        }

        // ── Vérification unicité email ────────────────────────
        // On vérifie AVANT de hasher le mot de passe pour éviter
        // un traitement inutile si l'email est déjà pris
        if (userRepository.existsByEmail(email)) {
            throw new ResourceConflictException("Cet email est déjà utilisé");
        }

        // ── Validation rôle ───────────────────────────────────
        // Seules deux valeurs sont acceptées — on rejette tout
        // autre rôle pour éviter les élévations de privilèges
        if (role == null ||
            (!role.equals("apprenant") && !role.equals("formateur"))) {
            throw new InvalidInputException(
                "Le rôle doit être apprenant ou formateur"
            );
        }

        // ── Hashage du mot de passe ───────────────────────────
        // On ne stocke JAMAIS un mot de passe en clair en BDD
        // EncryptionService gère le hashage (BCrypt ou AES
        // selon l'implémentation)
        String encryptedPassword = encryptionService.encrypt(password);

        // ── Création et sauvegarde de l'utilisateur ───────────
        User user = new User();
        user.setNom(nom);
        user.setPrenom(prenom);
        user.setEmail(email);
        user.setPassword(encryptedPassword);
        user.setRole(role);

        // save() insère en BDD et retourne l'entité avec son ID
        // généré automatiquement
        return userRepository.save(user);
    }


    // ─────────────────────────────────────────────────────────
    // LOGIN
    //
    // Étapes :
    //   1. Recherche de l'utilisateur par email
    //   2. Vérification du mot de passe
    //   3. Génération et retour du token JWT
    //
    // Important : on renvoie le même message d'erreur que
    // l'email soit inconnu ou que le mot de passe soit faux.
    // C'est volontaire — cela empêche de deviner si un email
    // est enregistré sur la plateforme (sécurité)
    // ─────────────────────────────────────────────────────────
    public String login(String email, String password) throws Exception {

        // ── Recherche utilisateur ─────────────────────────────
        // orElseThrow() lance AuthenticationFailedException
        // si aucun utilisateur n'a cet email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthenticationFailedException(
                    "Email ou mot de passe incorrect"
                ));

        // ── Vérification mot de passe ─────────────────────────
        // On déchiffre le mot de passe stocké et on le compare
        // au mot de passe reçu
        String storedPassword = encryptionService.decrypt(user.getPassword());
        if (!storedPassword.equals(password)) {
            throw new AuthenticationFailedException(
                "Email ou mot de passe incorrect"
            );
        }

        // ── Génération du token JWT ───────────────────────────
        // JwtService crée un token signé contenant :
        // email (sub), role, nom, prenom, userId
        // Ce token sera renvoyé à React et stocké dans
        // le localStorage
        return jwtService.generateToken(user);
    }
}