FROM nginx:1.28-alpine@sha256:a8b39bd9cf0f83869a2162827a0caf6137ddf759d50a171451b335cecc87d236
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css theme.css api.js app.js people.js /usr/share/nginx/html/
RUN chown -R nginx:nginx /var/cache/nginx /usr/share/nginx/html \
    && sed -i '/^user /d;s@^pid .*;@pid /tmp/nginx.pid;@' /etc/nginx/nginx.conf
USER nginx
EXPOSE 8080
