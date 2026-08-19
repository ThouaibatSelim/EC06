package com.example.auth_tp3.controller;

import lombok.Data;

/**
 * Représente le JSON envoyé par le client pour changer son mot de passe.
 *
 * Exemple JSON reçu :
 * {
 *   "email": "alice@mail.com",
 *   "oldPassword": "AncienMotDePasse123!",
 *   "newPassword": "NouveauMotDePasse123!",
 *   "confirmPassword": "NouveauMotDePasse123!"
 * }
 */
@Data
public class ChangePasswordRequest {
    private String email;
    private String oldPassword;
    private String newPassword;
    private String confirmPassword;
}