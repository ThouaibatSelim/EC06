# ─────────────────────────────────────────────────────────────────
# Dockerfile — skillhub-backend (Laravel)
# ─────────────────────────────────────────────────────────────────

# ── Stage 1 : Builder ─────────────────────────────────────────────
# On utilise php:8.2-alpine avec Composer installé manuellement
# pour éviter le conflit de version PHP 8.3 de l'image composer:2.7
FROM php:8.2-alpine AS builder

# Installation de Composer manuellement
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Dépendances système nécessaires pour Composer
RUN apk add --no-cache git unzip

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --ignore-platform-req=ext-mongodb

COPY . .

RUN composer dump-autoload --optimize --ignore-platform-req=ext-mongodb


# ── Stage 2 : Runtime ─────────────────────────────────────────────
FROM php:8.2-fpm-alpine

WORKDIR /var/www/html

# oniguruma-dev est requis pour l'extension mbstring
RUN apk add --no-cache \
    autoconf \
    g++ \
    make \
    openssl-dev \
    libssl3 \
    oniguruma-dev \
    libxml2-dev

RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    xml \
    ctype \
    bcmath

RUN pecl install mongodb && \
    docker-php-ext-enable mongodb

COPY --from=builder /app /var/www/html

RUN mkdir -p storage/logs storage/framework/cache \
             storage/framework/sessions storage/framework/views \
             bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]