<?php

namespace App\Services;

use App\Models\ActivityLog;

// ─────────────────────────────────────────────────────────────────
// ActivityLogService.php
// Rôle : enregistre les événements importants dans MongoDB
//
// Utilisé par FormationController et EnrollmentController
// pour tracer chaque action significative sur la plateforme.
//
// Événements enregistrés :
//   - course_view       → consultation d'une formation
//   - course_created    → création d'une formation
//   - course_updated    → modification (avec old/new values)
//   - course_deleted    → suppression d'une formation
//   - course_enrollment → inscription d'un apprenant
//
// Exemple de document créé dans MongoDB :
// {
//   "event"     : "course_enrollment",
//   "user_id"   : 3,
//   "course_id" : 5,
//   "timestamp" : "2026-04-19T10:30:00+00:00"
// }
// ─────────────────────────────────────────────────────────────────
class ActivityLogService
{
    // ─────────────────────────────────────────────────────────
    // log()
    //
    // Paramètres :
    //   $event → nom de l'événement (ex: "course_created")
    //   $data  → données spécifiques à l'événement
    //            (ex: ['course_id' => 5, 'created_by' => 2])
    //
    // La méthode fusionne automatiquement :
    //   - le nom de l'événement
    //   - l'horodatage ISO 8601
    //   - les données métier passées en paramètre
    //
    // Retourne void — on ne bloque jamais une action métier
    // si le log échoue (MongoDB peut être indisponible)
    // ─────────────────────────────────────────────────────────
    public function log(string $event, array $data): void
    {
        // array_merge combine le tableau de base avec $data
        // Si $data contient une clé "timestamp", elle
        // écrasera celle définie ici — comportement voulu
        // pour permettre des timestamps personnalisés
        ActivityLog::create(array_merge(
            [
                'event'     => $event,
                // now() retourne la date/heure actuelle
                // toIso8601String() formate en ISO 8601 :
                // "2026-04-19T10:30:00+00:00"
                // Format standard recommandé par le CDC
                'timestamp' => now()->toIso8601String(),
            ],
            $data
        ));
    }
}