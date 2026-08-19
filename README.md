## SkillHub
SkillHub est une plateforme collaborative d'apprentissage en ligne conçue pour faciliter l'échange de compétences entre utilisateurs (formateurs et apprenants). Cette version V2 repose sur une architecture micro-services pour garantir scalabilité et séparation des responsabilités.

## Stack Technique
L'application est découpée en trois modules principaux :

Frontend : React.js (Port 3000) - Interface utilisateur réactive et moderne.

Backend Métier : Laravel PHP (Port 8000) - Gestion de la logique métier et des données d'apprentissage.

Auth Service : Spring Boot + JWT (Port 8080) - Micro-service dédié à la sécurité et à l'authentification.

Bases de données : * MySQL : Données relationnelles (Utilisateurs, Formations).

MongoDB : Données non-relationnelles (Logs, contenus dynamiques).

## Architecture Microservices

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│  React (3000)    │─────▶│  Laravel (8000)   │─────▶│  Spring Boot (8080)  │
│  Frontend SPA     │      │  API Métier       │      │  Auth SSO / JWT      │
└─────────────────┘      └──────────────────┘      └─────────────────────┘
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

React ne parle jamais directement à MySQL/MongoDB : tout passe par Laravel (données métier) ou Spring Boot (authentification). Laravel et Spring Boot partagent la même base MySQL, mais seule Laravel possède le schéma (migrations) — Spring Boot se contente de le valider au démarrage (`spring.jpa.hibernate.ddl-auto=validate`), il ne le modifie jamais.

## Authentification SSO et gestion du JWT

L'authentification est entièrement déléguée au microservice Spring Boot (`skillhub-auth`), Laravel ne gère plus lui-même les mots de passe ni les sessions.

**Flux d'authentification :**
1. React envoie `email` + `password` à `POST /api/auth/login` sur Spring Boot (port 8080).
2. Spring Boot vérifie les identifiants et génère un JWT signé (HS256) contenant `role`, `nom`, `prenom`, `userId`, `sub` (email), `iat`, `exp` — valide 24h.
3. React stocke ce token (`localStorage`) et l'attache en header `Authorization: Bearer <token>` sur chaque appel à l'API Laravel.
4. `JwtVerifyMiddleware` (Laravel) intercepte la requête, extrait le token, et appelle `POST /api/auth/validate` sur Spring Boot pour le faire vérifier.
5. Si le token est valide, Spring Boot renvoie `email`, `role`, `userId` — Laravel les injecte dans la requête (`auth_user_id`, `auth_user_role`) et laisse passer vers le contrôleur.
6. Si invalide/expiré : 401. Si rôle insuffisant pour la route (`CheckRole` middleware) : 403.

Laravel ne connaît jamais le secret de signature JWT — seul Spring Boot peut émettre ou valider un token, ce qui centralise la sécurité dans un seul service.

## Règle métier — Limite d'inscription (Q1)

Un apprenant ne peut pas être inscrit à plus de **5 formations simultanément**.

- Vérifiée dans `EnrollmentController::store()` avant toute création d'inscription : compte les inscriptions actives de l'apprenant (`Enrollment::where('utilisateur_id', $userId)->count()`).
- Si la limite est atteinte : réponse **HTTP 400** avec un message explicite, aucune inscription n'est créée.
- Se désinscrire (`DELETE /api/formations/{id}/inscription`) libère un slot, permettant une nouvelle inscription.
- Couverte par 3 tests (`tests/Feature/EnrollmentTest.php`) : inscription en dessous de la limite (5ème formation OK), au-dessus de la limite (6ème refusée), et libération d'un slot après désinscription.

## Structure du Dépôt
skillhub-groupe/
├── .github/workflows/      # Pipelines CI/CD (GitHub Actions)

├── skillhub-frontend/      # Application React SPA

├── skillhub-backend/       # API Métier Laravel

├── skillhub-auth/          # Service d'authentification Spring Boot

├── docker-compose.yml      # Orchestration des conteneurs

├── .env.example            # Modèle de configuration (Laravel + Spring Boot)

└── README.md

## Installation et Lancement
Prérequis:

Docker Desktop, Git

Démarrage rapide

Cloner le projet, puis à la racine :

cp .env.example .env

Remplir APP_MASTER_KEY (32 caractères), JWT_SECRET, APP_KEY, et les identifiants MySQL/MongoDB dans .env.

Lancer avec Docker :

docker compose up --build

Puis lancer les migrations Laravel dans le conteneur :

docker compose exec skillhub-backend php artisan migrate --force

L'application sera accessible sur http://localhost:3000.

## Outils utilisés

- **SonarCloud** — analyse statique de qualité de code (bugs, vulnérabilités, code smells) sur les deux projets requis par le sujet : Laravel (`skillhub-backend`) et Spring Boot (`skillhub-auth`). Lancée automatiquement à chaque push/PR vers `dev`/`main`.
- **GitHub Actions** — intégration continue : installation des dépendances (Composer, npm, Maven), lint, exécution des tests (Laravel + Spring Boot), analyse SonarCloud, build des images Docker taguées au SHA du commit, et push vers le registry après merge sur `main`.
- **Docker / Docker Compose** — conteneurisation des 5 services (MySQL, MongoDB, Laravel, Spring Boot, React) avec healthchecks, pour un environnement reproductible en une seule commande (`docker compose up --build`).

Exécuter les tests localement :

Backend Laravel : `cd skillhub-backend && php artisan test`

Auth (Spring Boot) : `cd skillhub-auth && ./mvnw test`

## Analyse SonarCloud — Balises qualité après la nouvelle feature (Q1)

Résultats de l'analyse SonarCloud déclenchée par la PR `feature/ci-cd-pipeline` :

| Projet | Vue consultée | Quality Gate | Issues ouvertes | Couverture | Duplication |
|---|---|---|---|---|---|
| skillhub-auth (Spring Boot, EC062) | PR Summary (analyse de la PR) | ❌ Failed | 17 nouvelles | 0.0% | 0.0% |
| skillhub-backend (Laravel, EC063) | Project health dashboard (branche `main`) | Non calculé pour `main` (pas encore mergée) | 15 ouvertes, dont 12 issues de sécurité (rating C) | Pas de données | 0.0% |

**Cause de l'échec du Quality Gate sur EC062 :** la seule condition en échec est la **couverture de tests** — 0.0% mesuré contre 80.0% exigé par le profil "Sonar way". La duplication est à 0.0% (aucun souci).

**Pourquoi la couverture est à 0% malgré des tests qui passent :** le pipeline exécute bien les tests (`php artisan test`, `mvnw test`), mais aucune étape ne génère de rapport de couverture (`coverage.xml` pour Laravel, rapport JaCoCo pour Spring Boot) ni ne le transmet à SonarCloud — SonarCloud ne peut mesurer que ce qu'on lui fournit.

**Sur EC063 (Laravel) :** l'analyse au niveau de la Pull Request n'a pas été consultée en détail (Quality Gate spécifique à la PR à vérifier séparément) — les chiffres ci-dessus viennent du tableau de bord général de la branche `main`, pas encore analysée après merge.

**Plan d'action (sans modification de code, comme demandé par le sujet) :**
- Générer un rapport de couverture Laravel (`php artisan test --coverage-clover=coverage.xml`, nécessite Xdebug ou PCOV activé en CI) et le pointer via `sonar.php.coverage.reportPaths` — déjà configuré dans `sonar-project.properties`, il manque seulement la génération effective du rapport.
- Ajouter le plugin JaCoCo à `skillhub-auth/pom.xml` et une étape `mvnw jacoco:report` avant l'analyse SonarCloud, pour que Spring Boot remonte aussi une vraie couverture.
- Trier les 17 nouvelles issues (EC062) et les 12 issues de sécurité (EC063) par sévérité une fois le rapport de couverture en place.
- Après merge de la PR vers `main`, relancer une analyse pour obtenir un Quality Gate à jour sur les deux projets, avec la couverture réelle prise en compte.

## Stratégie de Branches
Nous utilisons un workflow inspiré de Git Flow :

main : Code stable prêt pour la production.

dev : Branche d'intégration des fonctionnalités.

feature/* : Développement de nouvelles fonctionnalités.

fix/* : Corrections de bugs.