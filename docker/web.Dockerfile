# Baut die Web-Version der App (Expo Web) und liefert sie als statische Seite aus.
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo

# Erst nur Manifeste kopieren, damit der Install-Layer gecacht wird.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/mobile/package.json apps/mobile/
COPY packages/core/package.json packages/core/
COPY packages/sport-packs/package.json packages/sport-packs/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter mobile exec expo export --platform web --output-dir dist

FROM nginx:1.29-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/mobile/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
