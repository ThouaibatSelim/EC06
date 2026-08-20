## Architecture Microservices

```
┌─────────────────┐      ┌─────────────────────┐
│  Laravel (8000)   │─────▶│  Spring Boot (8080)  │
│  API Métier       │      │  Auth SSO / JWT      │
└─────────────────┘      └─────────────────────┘
        │                             │
        ▼                             ▼
┌────────────┐               ┌────────────┐
│   MySQL     │               │   MySQL     │
│ (formations,│◀─────────────▶│  (users,    │
│ enrollments)│  table users   │  partagée)  │
└────────────┘  partagée      └────────────┘
        │
        ▼
┌────────────┐
│  MongoDB    │
│ (activity   │
│  logs)      │
└────────────┘
```

Laravel gère les données métier (formations, inscriptions) et délègue entièrement l'authentification à Spring Boot. Les deux services partagent la même base MySQL, mais seul Laravel possède le schéma (migrations) — Spring Boot se contente de le valider au démarrage (`spring.jpa.hibernate.ddl-auto=validate`), il ne le modifie jamais.

## Authentification SSO et gestion du JWT

L'authentification est entièrement déléguée au microservice Spring Boot (`skillhub-auth`) : Laravel ne gère ni mots de passe ni sessions.

**Flux d'authentification :**
1. Le client envoie `email` + `password` à `POST /api/auth/login` sur Spring Boot (port 8080).
2. Spring Boot vérifie les identifiants et génère un JWT signé (HS256) contenant `role`, `nom`, `prenom`, `userId`, `sub` (email), `iat`, `exp`.
3. Le token est attaché en header `Authorization: Bearer <token>` sur chaque appel à l'API Laravel.
4. `JwtVerifyMiddleware` (Laravel) intercepte la requête, extrait le token, et appelle `POST /api/auth/validate` sur Spring Boot pour le faire vérifier.
5. Si valide, Spring Boot renvoie `email`, `role`, `userId` — Laravel les injecte dans la requête (`auth_user_id`, `auth_user_role`) avant de laisser passer vers le contrôleur.
6. Token invalide/expiré → 401. Rôle insuffisant pour la route (`CheckRole` middleware) → 403.

Laravel ne connaît jamais le secret de signature JWT — seul Spring Boot peut émettre ou valider un token.

## Règle métier — Désinscription automatique des apprenants inactifs (Q1)

Un apprenant inactif depuis plus de 30 jours est automatiquement désinscrit de toutes ses formations en cours.

**Champ `last_activity_at`** : ajouté à la table `enrollments` (migration avec `Schema::hasColumn` en garde, rejouable sans erreur). Nullable — `NULL` signifie qu'aucune activité n'a encore été enregistrée pour cette inscription.

**Détection de l'activité** : le middleware `UpdateEnrollmentActivityMiddleware` (alias `track.activity`) met à jour `last_activity_at` à chaque fois qu'un apprenant accède à une formation à laquelle il est inscrit — appliqué sur `PUT /formations/{id}/progression`, le point d'interaction le plus significatif d'un apprenant actif dans son parcours.

**Logique de détection des inactifs** : la commande artisan `app:desinscription-inactivite` recherche toutes les inscriptions où `last_activity_at` est `NULL` **ou** antérieur à `now() - 30 jours`, les supprime, puis affiche et log un message explicite avec le nombre de désinscriptions effectuées.

```bash
php artisan app:desinscription-inactivite
```

Couverte par 4 tests (`tests/Feature/DesinscriptionInactiviteTest.php`) : inscription inactive depuis 31 jours (supprimée), inscription active récemment (conservée), inscription sans activité enregistrée (supprimée), et vérification du message de sortie de la commande.

## Installation et lancement

```bash
git clone <url-du-repo>
cd skillhub-ec06
cp .env.example .env
# Remplir APP_MASTER_KEY (32 caractères), JWT_SECRET, APP_KEY, identifiants MySQL/MongoDB
docker compose up --build
```

Une fois la stack démarrée, lancer les migrations Laravel dans le conteneur :

```bash
docker compose exec skillhub-backend php artisan migrate --force
```

## Outils utilisés

- **SonarCloud** — analyse statique de qualité de code (bugs, vulnérabilités, code smells, couverture) sur les deux projets requis : Laravel (`skillhub-backend`) et Spring Boot (`skillhub-auth`). Déclenchée automatiquement à chaque push/PR vers `dev`/`main`.
- **GitHub Actions** — intégration continue : installation des dépendances (Composer, Maven), lint (php-cs-fixer), exécution des tests (Laravel + Spring Boot), analyse SonarCloud, build des images Docker taguées au SHA du commit, et push vers le registry après merge sur `main`.
- **Docker / Docker Compose** — conteneurisation des services (MySQL, MongoDB, Laravel, Spring Boot) avec healthchecks, pour un environnement reproductible en une seule commande (`docker compose up --build`).

## Utilisation de l'IA

Claude (Anthropic) a été utilisé comme assistant pendant cette épreuve, conformément aux consignes du sujet (« Internet/IA » listé parmi les ressources autorisées). Usage principal :
- Aide au diagnostic d'erreurs d'environnement (Docker, migrations, configuration CI/CD).
- Relecture et suggestions de structure pour le code (migration, middleware, commande artisan, tests).
- Rédaction assistée de ce README.

Toutes les décisions d'architecture, la logique métier et la validation finale (tests exécutés, captures d'écran, choix d'implémentation) ont été réalisées et vérifiées par mes soins.

## Analyse SonarCloud — Balises qualité après la nouvelle feature (Q1)

> **Limitation de plan constatée** : le plan SonarCloud utilisé pour ce projet ne permet pas l'analyse décorée par Pull Request ("Your current plan does not include branch analysis"). Le rapport strictement "avant/après" par PR demandé par le sujet n'a donc pas pu être généré tel quel — les chiffres ci-dessous reflètent le dernier état d'analyse disponible sur le projet (branche `main`), à défaut d'une comparaison PR par PR.

| Projet | Security | Reliability | Maintainability | Duplications | Lignes analysées |
|---|---|---|---|---|---|
| skillhub-backend (Laravel, EC063) | 12 issues (C) | 0 issue (A) | 3 issues (A) | 0.0% | 578 |
| skillhub-auth (Spring Boot, EC062) | Aucune analyse disponible (limitation de plan + configuration de branche à revoir) | — | — | — | — |

**Plan d'action (sans modification de code, comme demandé par le sujet) :**
- Reconfigurer l'appel `mvnw sonar:sonar` dans `ci.yml` pour préciser explicitement `-Dsonar.branch.name` (ou passer par la GitHub Action officielle comme pour le backend), afin que l'analyse Spring Boot soit correctement rattachée à une branche et devienne visible.
- Activer un rapport de couverture (Xdebug/PCOV côté Laravel, JaCoCo côté Spring Boot) — actuellement 0% analysé faute de rapport transmis à SonarCloud, ce qui empêche d'évaluer objectivement la Quality Gate.
- Trier les 12 issues de sécurité (rating C) sur le backend Laravel en priorité, avant les 3 issues de maintenabilité.
- Vérifier les paramètres du projet SonarCloud (Administration → Branches) pour définir `dev` comme branche de référence, ce qui permettrait un vrai suivi avant/après à chaque nouvelle fonctionnalité.

