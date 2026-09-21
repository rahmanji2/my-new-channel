FROM alpine:latest

# প্রয়োজনীয় প্যাকেজ ইনস্টল
RUN apk update && apk add --no-cache \
    ffmpeg \
    nginx \
    ttf-dejavu \
    fontconfig \
    freetype \
    wget \
    curl \
    ca-certificates \
    bash

WORKDIR /app

# ফাইলগুলো কপি ও পারমিশন সেট
COPY . /app
RUN chmod +x /app/start.sh

# Nginx সরাসরি পোর্ট 10000 এবং /app/live ডিরেক্টরি পরিবেশন করবে
RUN echo 'events {} http { server { listen 10000; location /live/ { root /app; add_header Access-Control-Allow-Origin *; types { application/vnd.apple.mpegurl m3u8; video/mp2t ts; } } location /health { return 200 "OK"; } } }' > /etc/nginx/nginx.conf

EXPOSE 10000

CMD ["/app/start.sh"]
