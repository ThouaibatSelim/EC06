<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

// ─────────────────────────────────────────────────────────────────
// AuthController.php
// Rôle : gère les actions liées au profil utilisateur côté Laravel
//
// ⚠️  Dans l'architecture SkillHub V2, l'inscription et la
//     connexion sont gérées par Spring Boot (port 8080).
//     Laravel ne gère plus que :
//       - GET  /api/profile  → retourner les infos du user connecté
//       - POST /api/logout   → déconnexion côté client
//
// L'identité de l'utilisateur est injectée par le middleware
// JwtVerifyMiddleware qui appelle Spring Boot pour valider
// le token avant chaque requête protégée
// ─────────────────────────────────────────────────────────────────
class AuthController extends Controller
{
    // ─────────────────────────────────────────────────────────
    // GET /api/profile
    // Route protégée par le middleware jwt.verify
    //
    // JwtVerifyMiddleware a déjà validé le token JWT et injecté
    // les données de l'utilisateur dans la requête :
    //   $request->auth_user_id    → ID de l'utilisateur
    //   $request->auth_user_email → email de l'utilisateur
    //   $request->auth_user_role  → "apprenant" ou "formateur"
    //
    // On n'a pas besoin de requête BDD ici — les données
    // viennent directement du token JWT décodé par Spring Boot
    // ─────────────────────────────────────────────────────────
    public function profile(Request $request)
    {
        return response()->json([
            'id'    => $request->auth_user_id,
            'email' => $request->auth_user_email,
            'role'  => $request->auth_user_role,
        ]);
    }


    // ─────────────────────────────────────────────────────────
    // POST /api/logout
    //
    // JWT est stateless — il n'y a pas de session côté serveur
    // à détruire. La déconnexion se fait uniquement côté client
    // en supprimant le token du localStorage (géré par React).
    //
    // Cette route existe pour respecter le contrat REST
    // et permettre à React d'avoir un endpoint à appeler
    // ─────────────────────────────────────────────────────────
    public function logout()
    {
        return response()->json([
            'message' => 'Déconnexion côté client',
        ]);
    }
}