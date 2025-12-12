FROM node:lts-alpine@sha256:7e0bd0460b26eb3854ea5b99b887a6a14d665d14cae694b78ae2936d14b2befb AS base

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


# build production container
FROM node:lts-alpine@sha256:7e0bd0460b26eb3854ea5b99b887a6a14d665d14cae694b78ae2936d14b2befb

RUN apk --no-cache add dumb-init=1.2.5-r3

WORKDIR /app

RUN addgroup -S app && adduser -S -G app app

ENV NODE_ENV=production
USER app

COPY --from=deploy_backend /out/node_modules /app/node_modules
COPY --from=deploy_backend /out/dist /app/dist
COPY --from=deploy_backend /out/images /app/images
COPY --from=deploy_backend /out/drizzle /app/drizzle

COPY --from=build_frontend /builder/apps/frontend/build /app/public

EXPOSE 8000

HEALTHCHECK --interval=30s --retries=3 --start-period=30s --timeout=10s \
    CMD [ "curl", "--fail", "http://127.0.0.1:8000/api/health" ]

CMD ["dumb-init", "node", "dist/src/index.js"]
