<?php

namespace App\Http\Controllers;

use App\Models\Formation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Services\ActivityLogService;

// ─────────────────────────────────────────────────────────────────
// FormationController.php
// Rôle : gère toutes les opérations CRUD sur les formations
//
// Routes couvertes :
//   GET    /api/formations              → liste avec filtres
//   GET    /api/formations/{id}         → détail d'une formation
//   POST   /api/formations              → créer (formateur)
//   PUT    /api/formations/{id}         → modifier (formateur)
//   DELETE /api/formations/{id}         → supprimer (formateur)
//   GET    /api/formateur/formations    → mes formations
//
// Toutes les routes sauf index() et show() sont protégées
// par le middleware jwt.verify qui injecte dans $request :
//   $request->auth_user_id    → ID de l'utilisateur connecté
//   $request->auth_user_role  → "apprenant" ou "formateur"
// ─────────────────────────────────────────────────────────────────
class FormationController extends Controller
{
    // ─────────────────────────────────────────────────────────
    // GET /api/formations
    // Liste toutes les formations avec filtres optionnels
    //
    // Paramètres query string acceptés :
    //   ?search=react      → filtre par titre (LIKE)
    //   ?categorie=Design  → filtre par catégorie exacte
    //   ?niveau=Débutant   → filtre par niveau exact
    //
    // Accessible sans authentification (catalogue public)
    // ─────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        // with('formateur') charge le formateur en même temps
        // que les formations — évite le problème N+1
        // (une seule requête SQL au lieu de N+1)
        // On ne sélectionne que id, nom, prenom pour ne pas
        // exposer le mot de passe du formateur
        $query = Formation::with('formateur:id,nom,prenom');

        // Filtre par titre — recherche partielle (LIKE %...%)
        if ($request->has('search')) {
            $query->where('titre', 'like', '%' . $request->search . '%');
        }

        // Filtre par catégorie — valeur exacte
        if ($request->has('categorie')) {
            $query->where('categorie', $request->categorie);
        }

        // Filtre par niveau — valeur exacte
        if ($request->has('niveau')) {
            $query->where('niveau', $request->niveau);
        }

        // withCount('enrollments') ajoute enrollments_count
        // à chaque formation sans charger tous les enrollments
        $formations = $query->withCount('enrollments')->get();

        return response()->json($formations);
    }


    // ─────────────────────────────────────────────────────────
    // GET /api/formations/{id}
    // Détail complet d'une formation avec ses modules
    //
    // Actions supplémentaires déclenchées à chaque consultation :
    //   1. Incrémentation du compteur de vues
    //   2. Log MongoDB de l'événement "course_view"
    //
    // Accessible sans authentification (page détail publique)
    // ─────────────────────────────────────────────────────────
    public function show(Request $request, $id)
    {
        $formation = Formation::with([
            // Charge le formateur (id, nom, prenom uniquement)
            'formateur:id,nom,prenom',
            // Charge les modules triés par leur ordre défini
            'modules' => fn($q) => $q->orderBy('ordre')
        ])
        ->withCount('enrollments')
        ->find($id);

        if (!$formation) {
            return response()->json(['message' => 'Formation introuvable'], 404);
        }
        $formation->formateur->loadCount('formations');

        // Incrémente nombre_vues directement en BDD
        // increment() fait un UPDATE atomique — pas de race condition
        $formation->increment('nombre_vues');

        // Log MongoDB — trace chaque consultation de formation
        // auth_user_id peut être null si l'utilisateur n'est pas connecté
        (new ActivityLogService())->log('course_view', [
            'course_id' => (int) $id,
            'user_id'   => $request->auth_user_id ?? null,
        ]);

        return response()->json($formation);
    }


    // ─────────────────────────────────────────────────────────
    // POST /api/formations
    // Créer une nouvelle formation
    //
    // Réservé aux formateurs — vérifié par le middleware
    // jwt.verify + middleware role:formateur sur la route
    // ─────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        // Validation des données entrantes
        // required = champ obligatoire
        // in:... = valeur parmi une liste définie
        $validator = Validator::make($request->all(), [
            'titre'       => 'required|string|max:255',
            'description' => 'required|string',
            'categorie'   => 'required|string',
            'niveau'      => 'required|in:Débutant,Intermédiaire,Avancé',
        ]);

        if ($validator->fails()) {
            // 422 Unprocessable Entity = données invalides
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Reconstruction de l'objet user depuis les données
        // injectées par JwtVerifyMiddleware dans la requête
        $user = (object) [
            'id'   => $request->auth_user_id,
            'role' => $request->auth_user_role,
        ];

        // Création de la formation en BDD
        // formateur_id = ID du formateur connecté
        $formation = Formation::create([
            'titre'        => $request->titre,
            'description'  => $request->description,
            'categorie'    => $request->categorie,
            'niveau'       => $request->niveau,
            'formateur_id' => $user->id,
        ]);

        // Log MongoDB — trace chaque création de formation
        (new ActivityLogService())->log('course_created', [
            'course_id'  => $formation->id,
            'created_by' => $user->id,
        ]);

        // 201 Created = convention REST pour une création réussie
        return response()->json([
            'message'   => 'Formation créée avec succès',
            'formation' => $formation,
        ], 201);
    }


    // ─────────────────────────────────────────────────────────
    // PUT /api/formations/{id}
    // Modifier une formation existante
    //
    // Double vérification de sécurité :
    //   1. Middleware jwt.verify → utilisateur authentifié
    //   2. formateur_id === user->id → propriétaire de la formation
    //
    // Log MongoDB avec old_values et new_values pour traçabilité
    // ─────────────────────────────────────────────────────────
    public function update(Request $request, $id)
    {
        $formation = Formation::find($id);

        if (!$formation) {
            return response()->json(['message' => 'Formation introuvable'], 404);
        }

        $user = (object) [
            'id'   => $request->auth_user_id,
            'role' => $request->auth_user_role,
        ];

        // Vérifie que le formateur connecté est bien
        // le propriétaire de cette formation
        // 403 Forbidden = authentifié mais non autorisé
        if ($formation->formateur_id !== $user->id) {
            return response()->json([
                'message' => 'Vous ne pouvez modifier que vos propres formations',
            ], 403);
        }

        // "sometimes" = le champ est validé seulement s'il
        // est présent dans la requête — permet les mises à
        // jour partielles (PATCH-like) via PUT
        $validator = Validator::make($request->all(), [
            'titre'       => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'categorie'   => 'sometimes|string',
            'niveau'      => 'sometimes|in:Débutant,Intermédiaire,Avancé',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Sauvegarde des valeurs AVANT modification
        // pour le log MongoDB (historique des changements)
        $oldValues = $formation->only(['titre', 'description', 'categorie', 'niveau']);

        // only() filtre les champs autorisés — empêche
        // la modification de formateur_id ou nombre_vues
        $formation->update(
            $request->only(['titre', 'description', 'categorie', 'niveau'])
        );

        // Valeurs APRÈS modification
        $newValues = $formation->only(['titre', 'description', 'categorie', 'niveau']);

        // Log MongoDB — stocke avant/après pour traçabilité
        // Requis par le CDC : "stocker les valeurs avant et après"
        (new ActivityLogService())->log('course_updated', [
            'course_id'  => (int) $id,
            'updated_by' => $user->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);

        return response()->json([
            'message'   => 'Formation mise à jour',
            'formation' => $formation,
        ]);
    }


    // ─────────────────────────────────────────────────────────
    // DELETE /api/formations/{id}
    // Supprimer une formation
    //
    // Le log MongoDB est enregistré AVANT la suppression
    // pour conserver une trace même après la suppression
    // en BDD (le titre serait perdu après delete())
    // ─────────────────────────────────────────────────────────
    public function destroy(Request $request, $id)
    {
        $formation = Formation::find($id);

        if (!$formation) {
            return response()->json(['message' => 'Formation introuvable'], 404);
        }

        $user = (object) [
            'id'   => $request->auth_user_id,
            'role' => $request->auth_user_role,
        ];

        // Vérifie que le formateur est bien le propriétaire
        if ($formation->formateur_id !== $user->id) {
            return response()->json([
                'message' => 'Vous ne pouvez supprimer que vos propres formations',
            ], 403);
        }

        // Log MongoDB AVANT delete() — après suppression,
        // $formation->titre ne serait plus accessible
        (new ActivityLogService())->log('course_deleted', [
            'course_id'  => (int) $id,
            'deleted_by' => $user->id,
            'titre'      => $formation->titre,
        ]);

        $formation->delete();

        return response()->json(['message' => 'Formation supprimée']);
    }


    // ─────────────────────────────────────────────────────────
    // GET /api/formateur/formations
    // Liste uniquement les formations du formateur connecté
    //
    // Utilisé par le Dashboard Formateur pour afficher
    // ses propres formations avec leurs statistiques
    // ─────────────────────────────────────────────────────────
    public function mesFormations(Request $request)
    {
        $user = (object) [
            'id'   => $request->auth_user_id,
            'role' => $request->auth_user_role,
        ];

        $formations = Formation::where('formateur_id', $user->id)
            // Ajoute enrollments_count et modules_count
            // sans charger toutes les relations
            ->withCount(['enrollments', 'modules'])
            ->get();

        return response()->json($formations);
    }
}