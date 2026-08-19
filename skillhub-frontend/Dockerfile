# ─────────────────────────────────────────────────────────────────
# Dockerfile — skillhub-frontend (React/Vite)
# Build multi-stage :
#   Stage 1 "builder" → compile le projet React avec Vite
#   Stage 2 "runtime" → image nginx légère qui sert les fichiers
# ─────────────────────────────────────────────────────────────────
 
# ── Stage 1 : Builder ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

# npm install au lieu de npm ci car le package-lock.json
# est désynchronisé — npm install le met à jour automatiquement
RUN npm install

COPY . .

RUN npm run build
 
 
# ── Stage 2 : Runtime ─────────────────────────────────────────────
# nginx:alpine = image ultra légère pour servir des fichiers statiques
FROM nginx:alpine
 
# Copie les fichiers compilés par Vite dans le dossier servi par nginx
COPY --from=builder /app/dist /usr/share/nginx/html
 
# Configuration nginx pour React Router
# Sans ça, un refresh sur /formations renvoie une erreur 404
# car nginx cherche un fichier "formations" qui n'existe pas
# On redirige tout vers index.html et React Router gère la suite
COPY nginx.conf /etc/nginx/conf.d/default.conf
 
# ⚠️  Les variables d'environnement React (VITE_*)
# doivent être définies au moment du BUILD et non du runtime
# car Vite les intègre directement dans le code compilé
EXPOSE 80
 
CMD ["nginx", "-g", "daemon off;"]