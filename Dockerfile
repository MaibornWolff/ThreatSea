FROM node:lts-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f AS base

ENV CI=true
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable


# build frontend
FROM base AS build_frontend

ARG FRONTEND_DIR=apps/frontend
ENV NODE_ENV=production
ENV API_URI=""
ENV VITE_API_URI=$API_URI

WORKDIR /builder

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

RUN pnpm fetch --filter "..../${FRONTEND_DIR}"

COPY . .

RUN pnpm -r --filter "..../${FRONTEND_DIR}" install --frozen-lockfile
RUN pnpm -r --filter "..../${FRONTEND_DIR}" run build


# build backend
FROM base AS build_backend

ARG BACKEND_DIR=apps/backend

WORKDIR /builder

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

RUN pnpm fetch --filter "..../${BACKEND_DIR}"

COPY . .

RUN pnpm -r --filter "..../${BACKEND_DIR}" install --frozen-lockfile
RUN pnpm -r --filter "..../${BACKEND_DIR}" run build


FROM base AS deploy_backend

ARG BACKEND_DIR=apps/backend
ENV NODE_ENV=production

COPY --from=build_backend /builder /deployer
WORKDIR /deployer

RUN pnpm --filter "./${BACKEND_DIR}" deploy --legacy --prod /out


# build production container with gcr.io/distroless/nodejs24-debian13:nonroot
FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:f16acace4aa70086d4a2caad6c716f01e3e2fe0dd8274c4530c7c17d987bdb1a

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deploy_backend /out/node_modules /app/node_modules
COPY --from=deploy_backend /out/dist /app/dist
COPY --from=deploy_backend /out/images /app/images
COPY --from=deploy_backend /out/drizzle /app/drizzle

COPY --from=build_frontend /builder/apps/frontend/build /app/public

EXPOSE 8000

HEALTHCHECK --interval=30s --retries=3 --start-period=30s --timeout=10s \
    CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:8000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["dist/src/index.js"]
