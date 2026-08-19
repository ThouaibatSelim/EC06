package com.example.auth_tp3.service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.auth_tp3.entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

// ─────────────────────────────────────────────────────────────────
// JwtService.java
// Rôle : génération et validation des tokens JWT
//
// Un token JWT est composé de 3 parties séparées par des points :
//   header.payload.signature
//
//   - header    : algorithme utilisé (HS256)
//   - payload   : données encodées (email, role, nom, prenom...)
//   - signature : garantit que le token n'a pas été modifié
//
// Seul Spring Boot connaît le jwt.secret — Laravel et React
// ne peuvent pas créer de tokens, seulement les utiliser
// ─────────────────────────────────────────────────────────────────
@Service
public class JwtService {

    // @Value injecte la valeur de jwt.secret depuis
    // application.properties au démarrage de Spring Boot
    // La valeur réelle est dans le .env et ne doit jamais
    // être commitée sur Git
    @Value("${jwt.secret}")
    private String jwtSecret;

    // Durée de validité du token : 24h en millisecondes
    // 86400000 ms = 60s × 60min × 24h × 1000ms
    // Passé ce délai, validateToken() lèvera une exception
    // et l'utilisateur devra se reconnecter
    private static final long EXPIRATION_MS = 86_400_000;


    // ─────────────────────────────────────────────────────────
    // Génération du token JWT
    //
    // Appelée par AuthService.login() après vérification
    // du mot de passe.
    //
    // Le token contiendra dans son payload :
    //   - sub    : email (identifiant principal)
    //   - role   : "apprenant" ou "formateur"
    //   - nom    : nom de famille
    //   - prenom : prénom
    //   - userId : ID en base de données
    //   - iat    : date de création (auto)
    //   - exp    : date d'expiration (auto)
    // ─────────────────────────────────────────────────────────
    public String generateToken(User user) {

        // Les claims sont les données qu'on veut encoder
        // dans le payload du token
        Map<String, Object> claims = new HashMap<>();
        claims.put("role",   user.getRole());
        claims.put("nom",    user.getNom());
        claims.put("prenom", user.getPrenom());
        claims.put("userId", user.getId());

        return Jwts.builder()
                // Ajout des claims personnalisés (role, nom, prenom, userId)
                .setClaims(claims)
                // "sub" (subject) = identifiant principal de l'utilisateur
                .setSubject(user.getEmail())
                // Date de création du token
                .setIssuedAt(new Date())
                // Date d'expiration = maintenant + 24h
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                // Signature avec notre clé secrète et l'algo HS256
                // HS256 = HMAC-SHA256 — standard pour les JWT
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                // Sérialise le tout en String "header.payload.signature"
                .compact();
    }


    // ─────────────────────────────────────────────────────────
    // Clé de signature
    //
    // On convertit le secret (String) en clé cryptographique
    // utilisable par l'algorithme HS256.
    // Cette méthode est private car elle ne doit être utilisée
    // qu'en interne par generateToken() et validateToken()
    // ─────────────────────────────────────────────────────────
    private Key getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }


    // ─────────────────────────────────────────────────────────
    // Validation du token JWT
    //
    // Appelée par AuthController.validate() qui est lui-même
    // appelé par le middleware Laravel (JwtVerifyMiddleware.php)
    // pour vérifier chaque requête entrante.
    //
    // Lève une exception si :
    //   - la signature est invalide (token falsifié)
    //   - le token est expiré (exp dépassé)
    //   - le token est malformé
    //
    // Retourne les Claims (payload décodé) si tout est valide —
    // AuthController en extrait email, role et userId
    // ─────────────────────────────────────────────────────────
    public Claims validateToken(String token) {
        return Jwts.parserBuilder()
                // On utilise la même clé que pour la signature
                // Si le token a été modifié, la vérification échouera
                .setSigningKey(getSigningKey())
                .build()
                // parseClaimsJws vérifie signature + expiration
                // et lève une exception si invalide
                .parseClaimsJws(token)
                // getBody() retourne le payload décodé (Claims)
                .getBody();
    }
}