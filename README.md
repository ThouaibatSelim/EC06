## SkillHub
SkillHub est une plateforme collaborative d'apprentissage en ligne conçue pour faciliter l'échange de compétences entre utilisateurs (formateurs et apprenants). Cette version V2 repose sur une architecture micro-services pour garantir scalabilité et séparation des responsabilités.

## Stack Technique
L'application est découpée en trois modules principaux :

Frontend : React.js (Port 3000) - Interface utilisateur réactive et moderne.

Backend Métier : Laravel PHP (Port 8000) - Gestion de la logique métier et des données d'apprentissage.

Auth Service : Spring Boot + JWT (Port 8080) - Micro-service dédié à la sécurité et à l'authentification.

Bases de données : * MySQL : Données relationnelles (Utilisateurs, Formations).

MongoDB : Données non-relationnelles (Logs, contenus dynamiques).

## Structure du Dépôt
skillhub-groupe/
├── .github/workflows/      # Pipelines CI/CD (GitHub Actions)

├── skillhub-frontend/      # Application React SPA

├── skillhub-backend/       # API Métier Laravel

├── skillhub-auth/          # Service d'authentification Spring Boot

├── docker-compose.yml      # Orchestration des conteneurs

├── .env.example            # Modèle de configuration

└── README.md

## Installation et Lancement
Prérequis:

Docker Desktop, Git

Démarrage rapide

Cloner le projet :

git clone https://github.com/anneso09/skillhub-groupe.git

cd skillhub-groupe

Configurer l'environnement :

cp .env.example .env

Lancer avec Docker :

docker compose up --build

L'application sera accessible sur http://localhost:3000.

## Qualité et Tests
La qualité de notre code est vérifiée automatiquement avec l'intégration continue (CI)

## Analyse Statique
Le projet est analysé automatiquement par SonarCloud à chaque push sur les branches dev et main. L'analyse porte sur la détection de bugs, de vulnérabilités de sécurité et de "code smells".

Exécuter les tests localement

Backend Laravel :

cd skillhub-backend && php artisan test
Auth (Spring Boot) :

cd skillhub-auth && ./mvnw test

## Stratégie de Branches
Nous utilisons un workflow inspiré de Git Flow :

main : Code stable prêt pour la production.

dev : Branche d'intégration des fonctionnalités.

feature/* : Développement de nouvelles fonctionnalités.

fix/* : Corrections de bugs.

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

## Outils utilisés

- **SonarCloud** — analyse statique de qualité de code (bugs, vulnérabilités, code smells) sur les deux projets requis par le sujet : Laravel (`skillhub-backend`) et Spring Boot (`skillhub-auth`). Lancée automatiquement à chaque push/PR vers `dev`/`main`.
- **GitHub Actions** — intégration continue : installation des dépendances (Composer, npm, Maven), lint, exécution des tests (Laravel + Spring Boot), analyse SonarCloud, build des images Docker taguées au SHA du commit, et push vers le registry après merge sur `main`.
- **Docker / Docker Compose** — conteneurisation des 5 services (MySQL, MongoDB, Laravel, Spring Boot, React) avec healthchecks, pour un environnement reproductible en une seule commande (`docker compose up --build`).

## Analyse SonarCloud — Balises qualité après la nouvelle feature (Q1)

> ⚠️ Section à compléter avec les résultats réels une fois le pipeline CI/CD vert sur SonarCloud (Quality Gate, nombre de bugs/vulnérabilités/code smells, couverture). Exemple de structure à remplir :

| Projet | Quality Gate | Bugs | Vulnérabilités | Code Smells | Couverture |
|---|---|---|---|---|---|
| skillhub-backend (Laravel) | ✅/❌ | X | X | X | X% |
| skillhub-auth (Spring Boot) | ✅/❌ | X | X | X | X% |

**Plan d'action (sans modification de code, comme demandé par le sujet) :**
- [Lister ici les points remontés par SonarCloud après l'ajout de la feature `limite-inscriptions`, par ordre de priorité]
- [Ex: complexité cyclomatique de `store()` à surveiller si d'autres règles métier s'ajoutent — extraire la logique de comptage dans un service dédié]
- [Ex: dupliquer les tests de comptage entre EnrollmentTest et un futur test de service, à mutualiser]