FROM php:8.3-fpm

WORKDIR /var/www/html

# System deps
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libonig-dev \
    libpq-dev \
    nginx \
    supervisor \
    && docker-php-ext-install pdo_pgsql zip

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy app
COPY backend/ ./

# Install PHP deps
RUN composer install --no-interaction --prefer-dist --no-dev --optimize-autoloader

# Nginx config
COPY backend/docker/nginx.conf /etc/nginx/nginx.conf

# Supervisor to run php-fpm and nginx
COPY backend/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80

# Use a simple entrypoint that starts supervisor
CMD ["/usr/bin/supervisord", "-n"]
