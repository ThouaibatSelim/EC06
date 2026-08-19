<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\Formation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

// ─────────────────────────────────────────────────────────────────
// ModuleController.php
// Rôle : gère les modules à l'intérieur d'une formation
//
// Routes couvertes :
//   GET    /api/formations/{id}/modules  → liste des modules
//   POST   /api/formations/{id}/modules  → ajouter un module
//   PUT    /api/modules/{id}             → modifier un module
//   DELETE /api/modules/{id}             → supprimer un module
//
// Règle de sécurité appliquée partout :
//   Seul le formateur propriétaire de la formation peut
//   créer, modifier ou supprimer ses modules
// ─────────────────────────────────────────────────────────────────
class ModuleController extends Controller
{
    // ─────────────────────────────────────────────────────────
    // GET /api/formations/{formationId}/modules
    // Liste tous les modules d'une formation triés par ordre
    //
    // Accessible sans authentification — les modules sont
    // visibles sur la page détail de formation publique
    // ─────────────────────────────────────────────────────────
    public function index($formationId)
    {
        $formation = Formation::find($formationId);

        if (!$formation) {
            return response()->json(['message' => 'Formation introuvable'], 404);
        }

        // orderBy('ordre') garantit que les modules sont
        // toujours affichés dans le bon ordre pédagogique
        $modules = Module::where('formation_id', $formationId)
            ->orderBy('ordre')
            ->get();

        return response()->json($modules);
    }


    // ─────────────────────────────────────────────────────────
    // POST /api/formations/{formationId}/modules
    // Ajouter un nouveau module à une formation
    //
    // Si "ordre" n'est pas fourni, le module est ajouté
    // automatiquement à la fin (max ordre + 1)
    // ─────────────────────────────────────────────────────────
    public function store(Request $request, $formationId)
    {
        $formation = Formation::find($formationId);

        if (!$formation) {
            return response()->json(['message' => 'Formation introuvable'], 404);
        }

        $userId = $request->auth_user_id;

        // Vérifie que le formateur connecté est bien
        // le propriétaire de cette formation
        if ($formation->formateur_id !== $userId) {
            return response()->json([
                'message' => 'Vous ne pouvez gérer que les modules de vos propres formations',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'titre'   => 'required|string|max:255',
            'contenu' => 'required|string',
            // "sometimes" = ordre optionnel à la création
            'ordre'   => 'sometimes|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Si ordre non fourni → on prend le max actuel + 1
        // pour placer le module automatiquement à la fin
        // ?? 0 gère le cas où la formation n'a pas encore
        // de modules (max() retournerait null)
        $ordre = $request->ordre
            ?? (Module::where('formation_id', $formationId)->max('ordre') ?? 0) + 1;

        $module = Module::create([
            'titre'        => $request->titre,
            'contenu'      => $request->contenu,
            'formation_id' => $formationId,
            'ordre'        => $ordre,
        ]);

        return response()->json([
            'message' => 'Module créé avec succès',
            'module'  => $module,
        ], 201);
    }


    // ─────────────────────────────────────────────────────────
    // PUT /api/modules/{id}
    // Modifier un module existant
    //
    // On accède à la formation via la relation Eloquent
    // $module->formation pour vérifier le propriétaire —
    // cela charge la formation en mémoire via une requête SQL
    // ─────────────────────────────────────────────────────────
    public function update(Request $request, $id)
    {
        $module = Module::find($id);

        if (!$module) {
            return response()->json(['message' => 'Module introuvable'], 404);
        }

        $userId = $request->auth_user_id;

        // $module->formation charge la formation liée via
        // la relation belongsTo définie dans Module.php
        if ($module->formation->formateur_id !== $userId) {
            return response()->json([
                'message' => 'Vous ne pouvez modifier que vos propres modules',
            ], 403);
        }

        // Tous les champs sont optionnels pour permettre
        // une mise à jour partielle du module
        $validator = Validator::make($request->all(), [
            'titre'   => 'sometimes|string|max:255',
            'contenu' => 'sometimes|string',
            'ordre'   => 'sometimes|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // only() filtre les champs autorisés — empêche
        // la modification de formation_id par exemple
        $module->update($request->only(['titre', 'contenu', 'ordre']));

        return response()->json([
            'message' => 'Module mis à jour',
            'module'  => $module,
        ]);
    }


    // ─────────────────────────────────────────────────────────
    // DELETE /api/modules/{id}
    // Supprimer un module
    //
    // Même vérification de propriété que update() —
    // seul le formateur propriétaire peut supprimer
    // ─────────────────────────────────────────────────────────
    public function destroy(Request $request, $id)
    {
        $module = Module::find($id);

        if (!$module) {
            return response()->json(['message' => 'Module introuvable'], 404);
        }

        $userId = $request->auth_user_id;

        if ($module->formation->formateur_id !== $userId) {
            return response()->json([
                'message' => 'Vous ne pouvez supprimer que vos propres modules',
            ], 403);
        }

        $module->delete();

        return response()->json(['message' => 'Module supprimé']);
    }
}