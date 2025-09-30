FROM node:lts-alpine@sha256:cb3143549582cc5f74f26f0992cdef4a422b22128cb517f94173a5f910fa4ee7 AS base

ENV CI=true
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable


FROM base AS build

ARG BACKEND_DIR=apps/backend

WORKDIR /builder

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

RUN pnpm fetch --filter "..../${BACKEND_DIR}"

COPY . .

RUN pnpm -r --filter "..../${BACKEND_DIR}" install --frozen-lockfile
RUN pnpm -r --filter "..../${BACKEND_DIR}" run build


FROM base AS deploy

ARG BACKEND_DIR=apps/backend
ENV NODE_ENV=production

COPY --from=build /builder /deployer
WORKDIR /deployer

RUN pnpm --filter "./${BACKEND_DIR}" deploy --legacy --prod /out

# build production container
FROM node:lts-alpine@sha256:cb3143549582cc5f74f26f0992cdef4a422b22128cb517f94173a5f910fa4ee7

RUN apk --no-cache add dumb-init=1.2.5-r3

WORKDIR /server

USER root

ENV NODE_ENV=production

COPY --from=deploy /out/node_modules /server/node_modules
COPY --from=deploy /out/dist /server/dist
COPY --from=deploy /out/images /server/images
COPY --from=deploy /out/drizzle /server/drizzle

USER node

# Make port 8080 available to the world outside this container
EXPOSE 8000

HEALTHCHECK --interval=30s --retries=3 --start-period=30s --timeout=10s \
    CMD [ "curl", "--fail", "http://127.0.0.1:8000/projects" ]

# Run the app when the container launches
CMD ["dumb-init", "node", "dist/src/index.js"]


