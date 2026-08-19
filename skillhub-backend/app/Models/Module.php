<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ─────────────────────────────────────────────────────────────────
// Module.php
// Rôle : représente la table "modules" en MySQL
//
// Un module est une unité pédagogique d'une formation.
// Chaque formation doit contenir au minimum 3 modules
// (exigence du cahier des charges).
//
// Le champ "ordre" définit la séquence d'apprentissage —
// les modules sont toujours affichés triés par ordre croissant.
//
// Relations :
//   - belongsTo Formation → un module appartient à une formation
// ─────────────────────────────────────────────────────────────────
class Module extends Model
{
    protected $fillable = [
        'titre',        // titre du module
        'contenu',      // contenu pédagogique (texte, HTML...)
        'formation_id', // FK → table formations
        'ordre',        // position dans la séquence (1, 2, 3...)
    ];

    // Un module appartient à une formation
    // Cette relation est utilisée dans ModuleController
    // pour vérifier que le formateur connecté est bien
    // le propriétaire de la formation avant toute modification
    public function formation()
    {
        return $this->belongsTo(Formation::class);
    }
}