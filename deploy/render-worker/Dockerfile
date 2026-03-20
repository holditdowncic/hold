FROM node:20-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  ffmpeg \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libatspi2.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxkbcommon0 \
  libxrandr2 \
  libxrender1 \
  libxshmfence1 \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/remotion-video

COPY app/remotion-video/package*.json ./
RUN npm install --no-audit --no-fund

COPY app/remotion-video ./

RUN npx remotion browser ensure

EXPOSE 3001

CMD ["npx", "tsx", "src/render-service.ts"]
