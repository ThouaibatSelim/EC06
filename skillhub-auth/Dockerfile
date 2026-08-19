# ─────────────────────────────────────────────────────────────────
# Dockerfile — skillhub-auth (Spring Boot)
# Build multi-stage :
#   Stage 1 "build"   → compile le JAR avec Maven
#   Stage 2 "runtime" → image légère avec uniquement le JAR
# ─────────────────────────────────────────────────────────────────

# ── Stage 1 : Build ───────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS build

WORKDIR /app

# Copie pom.xml en premier — si le pom ne change pas, Docker
# réutilise le cache et ne retélécharge pas les dépendances Maven
COPY pom.xml .
COPY .mvn  .mvn
COPY mvnw  .
RUN chmod +x mvnw

# Télécharge les dépendances séparément du code source
# Cette couche est mise en cache tant que pom.xml ne change pas
RUN ./mvnw dependency:go-offline -B

COPY src ./src

# -DskipTests : les tests tournent dans la CI GitHub Actions,
# pas dans le build Docker — évite de doubler le temps de build
RUN ./mvnw package -DskipTests


# ── Stage 2 : Runtime ─────────────────────────────────────────────
# JRE Alpine = image minimale sans Maven ni code source
# Beaucoup plus légère et sécurisée que le JDK complet
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copie uniquement le JAR depuis le stage build
# Tout le reste (Maven, code source, .m2) est ignoré
COPY --from=build /app/target/*.jar app.jar

# ⚠️  Ne jamais mettre APP_MASTER_KEY ou JWT_SECRET ici
# Ces variables sont injectées au runtime via docker-compose.yml
# qui les lit depuis le fichier .env (jamais commité sur Git)
EXPOSE 8080

# Active le profil Docker de Spring Boot
# Spring Boot chargera application-docker.properties en plus
# de application.properties — permet d'overrider l'URL de la BDD
# (localhost:3306 → db:3306 dans Docker)
ENV SPRING_PROFILES_ACTIVE=docker

ENTRYPOINT ["java", "-jar", "app.jar"]