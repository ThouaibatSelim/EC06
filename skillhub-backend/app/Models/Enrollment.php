<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ─────────────────────────────────────────────────────────────────
// Enrollment.php
// Rôle : représente la table "enrollments" en MySQL
//
// Une inscription relie un apprenant à une formation.
// Elle stocke aussi la progression de l'apprenant (0-100%).
//
// Relations :
//   - belongsTo Formation  → une inscription appartient
//                            à une formation
//   - belongsTo User       → une inscription appartient
//                            à un apprenant
// ─────────────────────────────────────────────────────────────────
class Enrollment extends Model
{
    protected $fillable = [
        'utilisateur_id', // FK → table users
        'formation_id',   // FK → table formations
        'progression',    // entier 0-100 (pourcentage)
    ];

    // Une inscription appartient à une formation
    // Eloquent utilise formation_id comme clé étrangère
    // par convention (nom du model + _id)
    public function formation()
    {
        return $this->belongsTo(Formation::class);
    }

    // Une inscription appartient à un utilisateur
    // On précise 'utilisateur_id' car le nom de la FK
    // ne suit pas la convention Eloquent (user_id)
    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'utilisateur_id');
    }
}