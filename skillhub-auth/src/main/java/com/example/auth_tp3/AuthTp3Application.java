package com.example.auth_tp3;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// ─────────────────────────────────────────────────────────────────
// AuthTp3Application.java
// Rôle : point d'entrée principal de l'application Spring Boot
//
// C'est ce fichier qui est exécuté en premier quand on lance :
//   ./mvnw spring-boot:run
// ou quand Docker démarre le conteneur
// ─────────────────────────────────────────────────────────────────

// @SpringBootApplication regroupe 3 annotations en une :
//   @Configuration     → ce fichier peut définir des beans Spring
//   @EnableAutoConfiguration → Spring configure automatiquement
//                              les composants détectés (JPA, Web...)
//   @ComponentScan     → Spring scanne tous les fichiers du package
//                        com.example.auth_tp3 et ses sous-packages
//                        pour trouver @Service, @Repository, etc.
@SpringBootApplication
public class AuthTp3Application {

    public static void main(String[] args) {
        // Lance le serveur Spring Boot embarqué (Tomcat par défaut)
        // sur le port défini dans application.properties (8080)
        SpringApplication.run(AuthTp3Application.class, args);
    }
}