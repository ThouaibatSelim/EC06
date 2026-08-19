package com.example.auth_tp3.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth_tp3.entity.User;
import com.example.auth_tp3.repository.UserRepository;
import com.example.auth_tp3.service.AuthService;
import com.example.auth_tp3.service.JwtService;

import io.jsonwebtoken.Claims;

// ─────────────────────────────────────────────────────────────────
// AuthController.java
// Rôle : point d'entrée HTTP pour toutes les actions d'authentification
//
// 3 routes exposées :
//   POST /api/auth/register  → inscription d'un nouvel utilisateur
//   POST /api/auth/login     → connexion + génération du token JWT
//   POST /api/auth/validate  → vérification d'un token JWT
//                              (appelée par Laravel pour sécuriser ses routes)
// ─────────────────────────────────────────────────────────────────

// @RestController = @Controller + @ResponseBody
// Indique que chaque méthode renvoie directement du JSON
// et non une vue HTML
@RestController

// Toutes les routes de ce controller commencent par /api
@RequestMapping("/api")

// @CrossOrigin est commenté car le CORS est géré globalement
// dans CorsConfig.java — évite les conflits de configuration
// @CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})

public class AuthController {

    // ── Injection des dépendances par constructeur ────────────
    // Spring Boot injecte automatiquement ces services au démarrage.
    // On utilise l'injection par constructeur (et non @Autowired)
    // car c'est la bonne pratique : les dépendances sont
    // obligatoires et déclarées explicitement
    private final AuthService    authService;
    private final UserRepository userRepository;
    private final JwtService     jwtService;

    public AuthController(AuthService authService,
                          UserRepository userRepository,
                          JwtService jwtService) {
        this.authService    = authService;
        this.userRepository = userRepository;
        this.jwtService     = jwtService;
    }


    // ─────────────────────────────────────────────────────────
    // POST /api/auth/register
    //
    // Reçoit : { nom, prenom, email, password, role }
    // Renvoie : 201 CREATED + { message, email, nom, prenom }
    //
    // La logique métier (hashage du mot de passe, vérification
    // email unique) est déléguée à AuthService
    // ─────────────────────────────────────────────────────────
    @PostMapping("/auth/register")
    public ResponseEntity<Map<String, Object>> register(
            @RequestBody RegisterRequest request) throws Exception {

        // AuthService crée l'utilisateur en base et renvoie
        // l'entité User persistée avec son ID généré
        User user = authService.register(
                request.getNom(),
                request.getPrenom(),
                request.getEmail(),
                request.getPassword(),
                request.getRole()
        );

        // On construit la réponse JSON manuellement avec HashMap
        // On ne renvoie jamais le mot de passe hashé dans la réponse
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Inscription réussie");
        response.put("email",   user.getEmail());
        response.put("nom",     user.getNom());
        response.put("prenom",  user.getPrenom());

        // 201 CREATED = convention REST pour une création réussie
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    // ─────────────────────────────────────────────────────────
    // POST /api/auth/login
    //
    // Reçoit : { email, password }
    // Renvoie : 200 OK + { accessToken, role, nom, prenom, email }
    //
    // Le token JWT contient déjà role, nom, prenom, userId
    // mais on les renvoie aussi en clair dans le JSON pour que
    // React puisse les lire directement sans décoder le token
    // ─────────────────────────────────────────────────────────
    @PostMapping("/auth/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody LoginRequest request) throws Exception {

        // AuthService vérifie le mot de passe et génère le JWT
        // Lance une exception si email/password incorrects
        String token = authService.login(
                request.getEmail(),
                request.getPassword()
        );

        // On recharge l'utilisateur depuis la BDD pour avoir
        // ses informations complètes (nom, prenom, role)
        // orElseThrow() lance une exception si l'email n'existe pas
        // (ne devrait jamais arriver si authService.login a réussi)
        User user = userRepository.findByEmail(request.getEmail())
                                  .orElseThrow();

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", token);
        response.put("role",        user.getRole());
        response.put("nom",         user.getNom());
        response.put("prenom",      user.getPrenom());
        response.put("email",       user.getEmail());

        return ResponseEntity.ok(response);
    }


    // ─────────────────────────────────────────────────────────
    // POST /api/auth/validate
    //
    // Reçoit : { token }
    // Renvoie : 200 OK + { email, role, userId }
    //        ou 401 UNAUTHORIZED + { message }
    //
    // Cette route est appelée par le middleware Laravel
    // (JwtVerifyMiddleware.php) pour vérifier chaque requête
    // entrante sur l'API Laravel.
    // Elle n'est pas destinée à être appelée directement
    // par React.
    // ─────────────────────────────────────────────────────────
    @PostMapping("/auth/validate")
    public ResponseEntity<Map<String, Object>> validate(
            @RequestBody Map<String, String> body) {
        try {
            String token = body.get("token");

            // JwtService vérifie la signature et l'expiration du token
            // Lance une exception si le token est invalide ou expiré
            Claims claims = jwtService.validateToken(token);

            // Les Claims sont les données encodées dans le JWT
            // getSubject() renvoie le champ "sub" = l'email
            Map<String, Object> response = new HashMap<>();
            response.put("email",  claims.getSubject());
            response.put("role",   claims.get("role",   String.class));
            response.put("userId", claims.get("userId", Long.class));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            // Token invalide, expiré ou malformé
            // 401 = non autorisé → Laravel bloquera la requête
            return ResponseEntity
                    .status(401)
                    .body(Map.of("message", "Token invalide"));
        }
    }
}