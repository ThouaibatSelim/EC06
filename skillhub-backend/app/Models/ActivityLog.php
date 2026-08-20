<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

// ─────────────────────────────────────────────────────────────────
// ActivityLog.php
// Rôle : modèle Eloquent pour les logs MongoDB
//
// Contrairement aux autres models qui étendent
// Illuminate\Database\Eloquent\Model (MySQL),
// celui-ci étend MongoDB\Laravel\Eloquent\Model
// pour se connecter à MongoDB.
//
// Chaque document représente un événement enregistré :
//   - course_view       → consultation d'une formation
//   - course_created    → création d'une formation
//   - course_updated    → modification (avec old/new values)
//   - course_deleted    → suppression d'une formation
//   - course_enrollment → inscription d'un apprenant
// ─────────────────────────────────────────────────────────────────
class ActivityLog extends Model
{
    // Utilise la connexion MongoDB définie dans config/database.php
    // au lieu de la connexion MySQL par défaut
    protected $connection = 'mongodb';

    // Nom de la collection MongoDB
    // Équivalent du nom de table en SQL
    protected $collection = 'activity_logs';

    // Champs autorisés à être mass-assignés
    // Couvre tous les types d'événements possibles —
    // certains champs seront null selon le type d'événement
    protected $fillable = [
        'event',       // type d'événement (course_view, course_created...)
        'user_id',     // ID de l'utilisateur concerné
        'course_id',   // ID de la formation concernée
        'old_values',  // valeurs avant modification (course_updated)
        'new_values',  // valeurs après modification (course_updated)
        'created_by',  // ID du formateur créateur
        'updated_by',  // ID du formateur modificateur
        'deleted_by',  // ID du formateur suppresseur
        'titre',       // titre de la formation (course_deleted)
        'timestamp',   // horodatage de l'événement
    ];
}