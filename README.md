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

## Auteurs
Projet réalisé par Anne-Sophie Montenot, El-Fayed Manroufou et 
Thouaïbat Sélim dans le cadre du Bachelor Concepteur Développeur Web Full Stack.