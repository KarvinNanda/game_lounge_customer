# ============================================================
# Dockerfile — game_lounge_customer (Vue 3 Customer App)
# Multi-stage: build static files dengan Node, serve dengan Nginx.
# Versi image di-pin untuk build yang deterministik.
# ============================================================

# ── Stage 1: Build ──────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies dulu (layer cache) — npm ci = lockfile-exact
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

RUN npm run build

# ── Stage 2: Serve dengan Nginx ─────────────────────────────
FROM nginx:1.27-alpine

# Hapus default config bawaan agar hanya config kita yang aktif
RUN rm -f /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck — Coolify/orchestrator bisa deteksi container sehat
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
