<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Formation;
use Illuminate\Http\Request;
use App\Services\ActivityLogService;

// ─────────────────────────────────────────────────────────────────
// EnrollmentController.php
// Rôle : gère les inscriptions des apprenants aux formations
//
// Routes couvertes :
//   POST   /api/formations/{id}/inscription  → s'inscrire
//   DELETE /api/formations/{id}/inscription  → se désinscrire
//   GET    /api/apprenant/formations         → mes formations
//   PUT    /api/formations/{id}/progression  → mettre à jour
//
// Toutes les routes sont protégées par jwt.verify
// L'identité de l'apprenant vient de $request->auth_user_id
// injecté par JwtVerifyMiddleware
// ─────────────────────────────────────────────────────────────────
class EnrollmentController extends Controller
{
    // ─────────────────────────────────────────────────────────
    // POST /api/formations/{formationId}/inscription
    // Inscrire l'apprenant connecté à une formation
    //
    // Vérifie que :
    //   1. La formation existe
    //   2. L'apprenant n'est pas déjà inscrit
    // ─────────────────────────────────────────────────────────
    public function store(Request $request, $formationId)
    {
        $formation = Formation::find($formationId);

        if (!$formation) {
            return response()->json(['message' => 'Formation introuvable'], 404);
        }

        $userId = $request->auth_user_id;

        // Vérifie si une inscription existe déjà pour
        // cet apprenant sur cette formation
        // exists() est plus performant que first() — pas besoin
        // de charger l'objet complet, juste vérifier l'existence
        $dejaInscrit = Enrollment::where('utilisateur_id', $userId)
            ->where('formation_id', $formationId)
            ->exists();

        if ($dejaInscrit) {
            // 409 Conflict = ressource déjà existante
            return response()->json([
                'message' => 'Vous êtes déjà inscrit à cette formation',
            ], 409);
        }

        // ─────────────────────────────────────────────────────
        // Règle métier : un apprenant ne peut pas être inscrit
        // à plus de 5 formations simultanément.
        //
        // On compte toutes les inscriptions actives de l'apprenant
        // (une désinscription via DELETE /inscription libère un
        // "slot"). Si la limite est déjà atteinte, on refuse la
        // nouvelle inscription avec un message explicite.
        // ─────────────────────────────────────────────────────
        $nombreInscriptionsActives = Enrollment::where('utilisateur_id', $userId)->count();

        if ($nombreInscriptionsActives >= 5) {
            return response()->json([
                'message' => 'Limite de 5 formations simultanées atteinte. Désinscrivez-vous d\'une formation avant d\'en rejoindre une nouvelle.',
            ], 400);
        }

        // Création de l'inscription avec progression à 0
        // La progression sera mise à jour via updateProgression()
        $enrollment = Enrollment::create([
            'utilisateur_id' => $userId,
            'formation_id'   => $formationId,
            'progression'    => 0,
        ]);

        // Log MongoDB — trace chaque inscription
        (new ActivityLogService())->log('course_enrollment', [
            'user_id'   => $userId,
            'course_id' => (int) $formationId,
        ]);

        return response()->json([
            'message'    => 'Inscription réussie',
            'enrollment' => $enrollment,
        ], 201);
    }


    // ─────────────────────────────────────────────────────────
    // DELETE /api/formations/{formationId}/inscription
    // Désinscrire l'apprenant connecté d'une formation
    //
    // On vérifie que l'inscription appartient bien à
    // l'apprenant connecté — un apprenant ne peut pas
    // désinscrire un autre apprenant
    // ─────────────────────────────────────────────────────────
    public function destroy(Request $request, $formationId)
    {
        $userId = $request->auth_user_id;

        // Recherche l'inscription correspondant à cet apprenant
        // ET cette formation — double condition de sécurité
        $enrollment = Enrollment::where('utilisateur_id', $userId)
            ->where('formation_id', $formationId)
            ->first();

        if (!$enrollment) {
            return response()->json([
                'message' => 'Vous n\'êtes pas inscrit à cette formation',
            ], 404);
        }

        $enrollment->delete();

        return response()->json(['message' => 'Désinscription réussie']);
    }


    // ─────────────────────────────────────────────────────────
    // GET /api/apprenant/formations
    // Récupère toutes les formations suivies par l'apprenant
    //
    // Utilisé par le Dashboard Apprenant pour afficher
    // la liste des formations avec leur progression
    //
    // Charge formation.formateur pour afficher le nom
    // du formateur sur chaque card
    // ─────────────────────────────────────────────────────────
    public function mesFormations(Request $request)
    {
        $userId = $request->auth_user_id;

        $formations = Enrollment::where('utilisateur_id', $userId)
            // Charge la formation ET son formateur en une requête
            // :id,nom,prenom = sélectionne uniquement ces colonnes
            // pour ne pas exposer le mot de passe du formateur
            ->with('formation.formateur:id,nom,prenom')
            ->get()
            // map() transforme chaque enrollment en un objet
            // structuré pour le frontend
            ->map(function ($enrollment) {
                return [
                    'enrollment_id'    => $enrollment->id,
                    'progression'      => $enrollment->progression,
                    'date_inscription' => $enrollment->date_inscription,
                    'formation'        => $enrollment->formation,
                ];
            });

        return response()->json($formations);
    }


    // ─────────────────────────────────────────────────────────
    // PUT /api/formations/{formationId}/progression
    // Met à jour la progression de l'apprenant dans une formation
    //
    // Appelé par la page de suivi de formation quand l'apprenant
    // marque un module comme terminé
    //
    // La progression est un entier entre 0 et 100 (pourcentage)
    // ─────────────────────────────────────────────────────────
    public function updateProgression(Request $request, $formationId)
    {
        $userId = $request->auth_user_id;

        $enrollment = Enrollment::where('utilisateur_id', $userId)
            ->where('formation_id', $formationId)
            ->first();

        if (!$enrollment) {
            return response()->json([
                'message' => 'Vous n\'êtes pas inscrit à cette formation',
            ], 404);
        }

        // Validation stricte : entier entre 0 et 100
        // Laravel lève automatiquement une 422 si invalide
        $request->validate([
            'progression' => 'required|integer|min:0|max:100',
        ]);

        $enrollment->update(['progression' => $request->progression]);

        return response()->json([
            'message'    => 'Progression mise à jour',
            'enrollment' => $enrollment,
        ]);
    }
}