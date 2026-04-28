FROM php:8.3-cli

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libonig-dev \
    libpq-dev \
    && docker-php-ext-install pdo_pgsql zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY backend/ ./

RUN composer install --no-interaction --prefer-dist

CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
