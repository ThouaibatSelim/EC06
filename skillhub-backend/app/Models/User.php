<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Database\Eloquent\Factories\HasFactory;

// ─────────────────────────────────────────────────────────────────
// User.php
// Rôle : représente la table "users" en MySQL
//
// Ce model est partagé entre Laravel et Spring Boot :
//   - Spring Boot : crée et authentifie les utilisateurs
//   - Laravel     : lit les utilisateurs pour les formations
//                   et les inscriptions
//
// Implémente JWTSubject pour compatibilité avec tymon/jwt-auth
// même si dans la V2 l'auth JWT est gérée par Spring Boot.
// Conservé pour ne pas casser la compatibilité.
//
// Relations :
//   - hasMany Formation  → un formateur a plusieurs formations
//   - hasMany Enrollment → un apprenant a plusieurs inscriptions
// ─────────────────────────────────────────────────────────────────
class User extends Authenticatable implements JWTSubject
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'password',
        'role', // "apprenant" ou "formateur"
    ];

    // $hidden empêche ces champs d'apparaître dans les
    // réponses JSON — le mot de passe ne doit jamais
    // être exposé dans une API
    protected $hidden = [
        'password',
    ];

    // ── Méthodes JWTSubject ───────────────────────────────────
    // Requises par l'interface JWTSubject de tymon/jwt-auth
    // Conservées pour compatibilité même si Spring Boot
    // gère la génération des tokens JWT dans la V2

    // Retourne l'identifiant unique utilisé dans le token
    // getKey() retourne la valeur de la clé primaire (id)
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    // Retourne les claims personnalisés à ajouter au token
    // Vide ici car Spring Boot gère les claims (role, nom...)
    public function getJWTCustomClaims()
    {
        return [];
    }

    // ── Relations ─────────────────────────────────────────────

    // Un formateur a plusieurs formations
    // On précise 'formateur_id' car la FK ne suit pas
    // la convention Eloquent (user_id)
    public function formations()
    {
        return $this->hasMany(Formation::class, 'formateur_id');
    }

    // Un apprenant a plusieurs inscriptions
    // On précise 'utilisateur_id' pour la même raison
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'utilisateur_id');
    }
}