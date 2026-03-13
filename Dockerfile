FROM php:8.2-apache

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy project files (excluding frontend/ and other heavy dirs)
COPY . .

# Create storage dirs (gitignored, may not exist in repo) then set permissions
RUN mkdir -p storage/expedientes storage/documentos storage/firmas storage/logs storage/temp \
    && chown -R www-data:www-data storage/ \
    && chmod -R 775 storage/

# Set DocumentRoot to public/
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf
RUN sed -ri -e 's!/var/www/!/var/www/html/public!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Allow .htaccess overrides (needed for URL routing)
RUN sed -ri -e 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Railway sets PORT env var; Apache needs to listen on it
# Use a startup script to configure the port dynamically
COPY devops/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose default port (Railway overrides via PORT env var)
EXPOSE 80

CMD ["/docker-entrypoint.sh"]
