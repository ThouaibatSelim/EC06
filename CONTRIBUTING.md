# Comment contribuer au projet SkillHub V2

## Équipe
- Anne-Sophie — Chef de projet, Git, CI/CD, Spring Boot Docker Compose
- El-Fayed — Laravel, Dockerfiles backend
- Thouaibat — React, SonarCloud

## Branches
- `main` — version finale stable, on ne pousse jamais directement dessus
- `dev` — branche de travail principale
- `feature/nom-de-la-tache` — une branche par tâche

## Comment travailler
1. Toujours partir de `dev` pour créer ta branche
2. Nommer sa branche : `feature/ce-que-tu-fais` (ex: `feature/docker-laravel`)
3. Faire des commits réguliers avec des messages clairs
4. Ouvrir une Pull Request vers `dev` quand c'est terminé
5. Un autre membre relit avant de merger

## Format des commits
- `feat: description` — nouvelle fonctionnalité
- `fix: description` — correction d'un bug
- `docker: description` — fichiers Docker
- `ci: description` — pipeline CI/CD
- `docs: description` — documentation