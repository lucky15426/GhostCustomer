# ============================================================================
# Ghost Customer AI — Next.js 15 web image
# Standard (non-standalone) build + start. Mirrors `npm run build` / `npm run start`.
#
#   Build:  docker build -t ghost-web .
#   Run:    docker run -p 3000:3000 --env-file .env.local ghost-web
#
# Works fully offline with NO keys: the app falls back to the deterministic
# seeded mock engine, so the entire demo still runs end to end.
# ============================================================================
FROM node:22-alpine

WORKDIR /app

# Next.js binds to PORT (default 3000) and listens on all interfaces.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# --- Dependencies (cached layer) --------------------------------------------
# Copy manifests first so deps only reinstall when they change.
# .npmrc already sets legacy-peer-deps=true (React 19 peer ranges); pass the
# flag explicitly too so the build is robust regardless of .npmrc presence.
COPY package.json package-lock.json* .npmrc* ./
RUN npm install --legacy-peer-deps

# --- Application source ------------------------------------------------------
COPY . .

# Produce the production .next build.
RUN npm run build

EXPOSE 3000

# `next start` serves the build on port 3000.
CMD ["npm", "run", "start"]
