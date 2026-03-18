FROM node:20-alpine AS build

# System deps required by node-canvas
RUN apk add --no-cache \
    build-base \
    g++ \
    python3 \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    freetype-dev

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY server.js .

# ─── Runtime image ────────────────────────────────────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    freetype

WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY server.js .

ENV PORT=3005
ENV FIGURE_DIR=/assets/bundled/figure
ENV GAMEDATA_DIR=/assets/gamedata

EXPOSE 3005
CMD ["node", "server.js"]
