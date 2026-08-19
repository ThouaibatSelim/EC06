<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// ─────────────────────────────────────────────────────────────────
// Formation.php
// Rôle : représente la table "formations" en MySQL
//
// C'est l'entité centrale de SkillHub.
// Une formation appartient à un formateur et contient
// plusieurs modules. Des apprenants peuvent s'y inscrire.
//
// Relations :
//   - belongsTo User        → la formation a un formateur
//   - hasMany Module        → une formation a plusieurs modules
//   - hasMany Enrollment    → une formation a plusieurs inscrits
// ─────────────────────────────────────────────────────────────────
class Formation extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'description',
        'categorie',
        'nombre_vues',  // incrémenté à chaque consultation (show())
        'niveau',       // Débutant | Intermédiaire | Avancé
        'formateur_id', // FK → table users (rôle formateur)
    ];

    // Une formation appartient à un formateur (User)
    // On précise 'formateur_id' car la FK ne suit pas
    // la convention Eloquent (user_id)
    public function formateur()
    {
        return $this->belongsTo(User::class, 'formateur_id');
    }

    // Une formation a plusieurs modules
    // Utilisé avec ->orderBy('ordre') dans ModuleController
    // et FormationController pour respecter l'ordre pédagogique
    public function modules()
    {
        return $this->hasMany(Module::class);
    }

    // Une formation a plusieurs inscriptions
    // Utilisé avec withCount('enrollments') pour afficher
    // le nombre d'apprenants inscrits
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }
}