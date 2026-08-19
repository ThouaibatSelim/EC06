<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FormationController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\EnrollmentController;

// ─────────────────────────────────────────────────────────────────
// routes/api.php
// Rôle : définit toutes les routes de l'API REST Laravel
//
// Toutes ces routes sont automatiquement préfixées par /api
// (configuré dans bootstrap/app.php)
// Ex: Route::get('/formations') → accessible via /api/formations
//
// Architecture des middlewares en V2 :
//   Aucun middleware  → public (sans token)
//   jwt.verify        → authentifié (token valide requis)
//   jwt.verify + role → authentifié ET rôle spécifique requis
//
// ⚠️  /api/register et /api/login sont commentés car
//     ces routes sont désormais gérées par Spring Boot (8080)
//     et non plus par Laravel
// ─────────────────────────────────────────────────────────────────


// ── Routes publiques ──────────────────────────────────────────────
// Accessibles sans token — pages publiques de SkillHub
// Un visiteur non connecté peut consulter le catalogue

// Liste des formations avec filtres (search, categorie, niveau)
Route::get('/formations',              [FormationController::class, 'index']);

// Détail d'une formation + incrément des vues + log MongoDB
Route::get('/formations/{id}',         [FormationController::class, 'show']);

// Liste des modules d'une formation (page détail publique)
Route::get('/formations/{id}/modules', [ModuleController::class,   'index']);


// ── Routes protégées (jwt.verify requis) ──────────────────────────
// JwtVerifyMiddleware appelle Spring Boot pour valider le token
// et injecte auth_user_id, auth_user_role, auth_user_email
Route::middleware('jwt.verify')->group(function () {

    // Déconnexion — JWT est stateless, juste une confirmation
    Route::post('/logout',  [AuthController::class, 'logout']);

    // Profil de l'utilisateur connecté (données du token)
    Route::get('/profile',  [AuthController::class, 'profile']);


    // ── Routes formateur uniquement ───────────────────────────
    // Double protection : jwt.verify + role:formateur
    // Un apprenant connecté recevra 403 sur ces routes
    Route::middleware('role:formateur')->group(function () {

        // CRUD formations
        Route::post('/formations',          [FormationController::class, 'store']);
        Route::put('/formations/{id}',      [FormationController::class, 'update']);
        Route::delete('/formations/{id}',   [FormationController::class, 'destroy']);

        // Mes formations (dashboard formateur)
        Route::get('/formateur/formations', [FormationController::class, 'mesFormations']);

        // CRUD modules
        Route::post('/formations/{id}/modules', [ModuleController::class, 'store']);
        Route::put('/modules/{id}',             [ModuleController::class, 'update']);
        Route::delete('/modules/{id}',          [ModuleController::class, 'destroy']);
    });


    // ── Routes apprenant uniquement ───────────────────────────
    // Double protection : jwt.verify + role:apprenant
    // Un formateur connecté recevra 403 sur ces routes
    Route::middleware('role:apprenant')->group(function () {

        // Inscription / désinscription à une formation
        Route::post('/formations/{id}/inscription',   [EnrollmentController::class, 'store']);
        Route::delete('/formations/{id}/inscription', [EnrollmentController::class, 'destroy']);

        // Mes formations suivies (dashboard apprenant)
        Route::get('/apprenant/formations',           [EnrollmentController::class, 'mesFormations']);

        // Mise à jour de la progression dans une formation
        Route::put('/formations/{id}/progression',    [EnrollmentController::class, 'updateProgression']);
    });
});