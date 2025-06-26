# Use the official NGINX image as base
FROM nginx:latest

# Create a non-root user and group
RUN addgroup --system nginxgroup && adduser --system --no-create-home --ingroup nginxgroup nginxuser

# Set permissions for required directories
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx \
    && chown -R nginxuser:nginxgroup /var/cache/nginx /var/run /var/log/nginx

# Move NGINX PID file to /tmp (or ensure /var/run is writable)
RUN touch /var/run/nginx.pid && chown nginxuser:nginxgroup /var/run/nginx.pid

# Change NGINX temp and PID file locations in config
RUN sed -i 's|pid /var/run/nginx.pid;|pid /tmp/nginx.pid;|g' /etc/nginx/nginx.conf \
    && sed -i 's|/var/cache/nginx/client_temp|/tmp/client_temp|g' /etc/nginx/nginx.conf

# Ensure writable temp directories exist
RUN mkdir -p /tmp/client_temp /tmp/nginx_temp && chown -R nginxuser:nginxgroup /tmp/client_temp /tmp/nginx_temp

# Copy static content and NGINX config
COPY ./buildfolder_modules /usr/share/nginx/html
COPY ./modules.default.conf /etc/nginx/conf.d/default.conf

# Change NGINX to listen on a non-root port (e.g., 8080)
RUN sed -i 's/listen 80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Switch to non-root user
USER nginxuser

# Expose non-root port
EXPOSE 8080

# Override default entrypoint to fix permissions before running NGINX
ENTRYPOINT ["/bin/sh", "-c", "chown -R nginxuser:nginxgroup /var/run && exec nginx -g 'daemon off;'"]
