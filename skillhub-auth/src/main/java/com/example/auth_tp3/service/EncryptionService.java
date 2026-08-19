package com.example.auth_tp3.service;

import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

// ─────────────────────────────────────────────────────────────────
// EncryptionService.java
// Rôle : chiffrement et déchiffrement des mots de passe (AES-GCM)
//
// Pourquoi AES-GCM et pas BCrypt ?
//   BCrypt est un hash à sens unique — on ne peut pas retrouver
//   le mot de passe original. AES-GCM est réversible, ce qui
//   permet à AuthService.login() de comparer les mots de passe.
//
// Format de stockage en BDD : v1:Base64(iv):Base64(ciphertext)
//   - v1         : version du format (pour évoluer si besoin)
//   - iv         : vecteur d'initialisation aléatoire
//   - ciphertext : mot de passe chiffré
//
// ⚠️  La Master Key (APP_MASTER_KEY) ne doit JAMAIS être
//     dans le code ou commitée sur Git — uniquement dans .env
// ─────────────────────────────────────────────────────────────────
@Service
public class EncryptionService {

    // Taille du vecteur d'initialisation en bytes
    // 12 bytes = taille recommandée pour AES-GCM
    private static final int GCM_IV_LENGTH  = 12;

    // Taille du tag d'authentification GCM en bits
    // 128 bits = taille maximale, garantit l'intégrité des données
    private static final int GCM_TAG_LENGTH = 128;

    // Clé AES dérivée depuis APP_MASTER_KEY
    // final = immuable après initialisation dans le constructeur
    private final SecretKey masterKey;

    // SecureRandom génère des nombres vraiment aléatoires
    // (contrairement à Random qui est prévisible)
    // On le crée une seule fois car c'est coûteux à instancier
    private final SecureRandom secureRandom = new SecureRandom();


    // ─────────────────────────────────────────────────────────
    // Constructeur
    //
    // @Value("${app.master.key}") injecte la valeur de
    // APP_MASTER_KEY depuis application.properties / .env
    //
    // Si la clé est absente au démarrage → exception immédiate
    // L'application refuse de démarrer sans sa clé de chiffrement
    // C'est un comportement voulu : mieux vaut crasher au démarrage
    // que de stocker des mots de passe non chiffrés en silence
    // ─────────────────────────────────────────────────────────
    public EncryptionService(@Value("${app.master.key}") String masterKeyValue) {

        if (masterKeyValue == null || masterKeyValue.isBlank()) {
            throw new IllegalStateException(
                "APP_MASTER_KEY est absente ! " +
                "L'application ne peut pas démarrer sans la Master Key."
            );
        }

        // On dérive une clé AES-256 depuis la Master Key
        // AES-256 nécessite exactement 32 bytes (256 bits)
        // On padde avec des zéros si la clé est trop courte,
        // on tronque si elle est trop longue
        byte[] keyBytes = masterKeyValue.getBytes();
        byte[] aesKey   = new byte[32];
        System.arraycopy(keyBytes, 0, aesKey, 0, Math.min(keyBytes.length, 32));
        this.masterKey  = new SecretKeySpec(aesKey, "AES");
    }


    // ─────────────────────────────────────────────────────────
    // Chiffrement AES-GCM
    //
    // Appelé par AuthService.register() avant de sauvegarder
    // l'utilisateur en BDD.
    //
    // L'IV est regénéré aléatoirement à chaque appel :
    // deux chiffrements du même mot de passe donnent des
    // résultats différents — empêche les attaques par
    // comparaison de hash (rainbow tables)
    // ─────────────────────────────────────────────────────────
    public String encrypt(String plaintext) throws Exception {

        // Génération de l'IV aléatoire
        byte[] iv = new byte[GCM_IV_LENGTH];
        secureRandom.nextBytes(iv);

        // Configuration du cipher AES en mode GCM sans padding
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(
            Cipher.ENCRYPT_MODE,
            masterKey,
            new GCMParameterSpec(GCM_TAG_LENGTH, iv)
        );

        // Chiffrement du mot de passe
        byte[] ciphertext = cipher.doFinal(plaintext.getBytes());

        // Encodage Base64 pour stockage en BDD (texte lisible)
        // Base64 convertit les bytes binaires en caractères ASCII
        String ivBase64         = Base64.getEncoder().encodeToString(iv);
        String ciphertextBase64 = Base64.getEncoder().encodeToString(ciphertext);

        // Format final stocké en BDD
        return "v1:" + ivBase64 + ":" + ciphertextBase64;
    }


    // ─────────────────────────────────────────────────────────
    // Déchiffrement AES-GCM
    //
    // Appelé par AuthService.login() pour comparer le mot de
    // passe saisi avec celui stocké en BDD.
    //
    // GCM vérifie automatiquement l'intégrité des données :
    // si le ciphertext a été modifié en BDD, le déchiffrement
    // échoue avec une exception — protection contre la
    // falsification des données
    // ─────────────────────────────────────────────────────────
    public String decrypt(String encryptedData) throws Exception {

        // Découpage du format "v1:iv:ciphertext"
        String[] parts = encryptedData.split(":");
        if (parts.length != 3 || !parts[0].equals("v1")) {
            throw new IllegalArgumentException(
                "Format de données chiffrées invalide"
            );
        }

        // Décodage Base64 → bytes
        byte[] iv         = Base64.getDecoder().decode(parts[1]);
        byte[] ciphertext = Base64.getDecoder().decode(parts[2]);

        // Configuration du cipher en mode déchiffrement
        // avec le même IV que lors du chiffrement
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(
            Cipher.DECRYPT_MODE,
            masterKey,
            new GCMParameterSpec(GCM_TAG_LENGTH, iv)
        );

        // Déchiffrement et retour du mot de passe en clair
        byte[] plaintext = cipher.doFinal(ciphertext);
        return new String(plaintext);
    }
}