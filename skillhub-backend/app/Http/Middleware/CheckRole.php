<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

// ─────────────────────────────────────────────────────────────────
// CheckRole.php
// Rôle : vérifie que l'utilisateur connecté a le bon rôle
//
// Ce middleware s'utilise APRÈS jwt.verify dans la chaîne —
// jwt.verify injecte auth_user_role dans $request,
// CheckRole vérifie que ce rôle correspond à ce qui est requis.
//
// Utilisation dans les routes (routes/api.php) :
//   ->middleware(['jwt.verify', 'role:formateur'])
//   ->middleware(['jwt.verify', 'role:apprenant'])
//
// Exemples :
//   POST /api/formations        → role:formateur uniquement
//   POST /api/.../inscription   → role:apprenant uniquement
// ─────────────────────────────────────────────────────────────────
class CheckRole
{
    // $role est passé dynamiquement depuis la définition de la route
    // ex: 'role:formateur' → $role = "formateur"
    public function handle(Request $request, Closure $next, string $role)
    {
        // Récupère le rôle injecté par JwtVerifyMiddleware
        // Si jwt.verify n'a pas tourné avant, auth_user_role
        // sera null et l'accès sera refusé
        $user = (object) [
            'role' => $request->auth_user_role,
        ];

        // Vérifie que le rôle de l'utilisateur correspond
        // exactement au rôle requis par la route
        if (!$user || $user->role !== $role) {
            // 403 Forbidden = authentifié mais pas autorisé
            // (différent du 401 qui signifie non authentifié)
            return response()->json([
                'message' => 'Accès refusé. Rôle requis : ' . $role,
            ], 403);
        }

        // Rôle valide → on laisse passer la requête
        return $next($request);
    }
}