<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Enrollment;

// ─────────────────────────────────────────────────────────────────
// UpdateEnrollmentActivityMiddleware.php
// Rôle : marque une inscription comme "active" à chaque accès
//        de l'apprenant à la formation correspondante
//
// Appliqué sur les routes apprenant qui touchent une formation
// précise (ex: mise à jour de progression). Ne bloque jamais la
// requête — si l'inscription n'existe pas (edge case), on laisse
// simplement passer sans erreur, le contrôleur gère déjà ce cas.
// ─────────────────────────────────────────────────────────────────
class UpdateEnrollmentActivityMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $userId = $request->auth_user_id;
        $formationId = $request->route('id');

        if ($userId && $formationId) {
            Enrollment::where('utilisateur_id', $userId)
                ->where('formation_id', $formationId)
                ->update(['last_activity_at' => now()]);
        }

        return $next($request);
    }
}
