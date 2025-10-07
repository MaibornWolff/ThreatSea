FROM node:lts-alpine@sha256:cb3143549582cc5f74f26f0992cdef4a422b22128cb517f94173a5f910fa4ee7 AS base

ENV CI=true
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable


# build static frontend
FROM base AS build

ARG FRONTEND_DIR=apps/frontend
ENV NODE_ENV=production
ARG API_URI
ENV API_URI=$API_URI
ENV VITE_API_URI=$API_URI

WORKDIR /builder

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

RUN pnpm fetch --filter "..../${FRONTEND_DIR}"

# Copy the current directory contents into the container
COPY . .

# build
RUN pnpm -r --filter "..../${FRONTEND_DIR}" install --frozen-lockfile
RUN pnpm -r --filter "..../${FRONTEND_DIR}" run build


# production environment with nginx webserver
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:fc9f44f1f2fe886b773c1d24ef3b9ceb7a459c10c43a380b88e3e385304ce678

ARG FRONTEND_DIR=apps/frontend
ARG API_URI
ENV API_URI=$API_URI

USER root

USER nginx

# Make port 3000 available to the world outside this container
# We need a port >1023 to run as user
# Unfortunately, the base image also publishes port 8080 and we cannot revert that
EXPOSE 3000/tcp

COPY --from=build /builder/${FRONTEND_DIR}/build /usr/share/nginx/html
COPY --from=build /builder/${FRONTEND_DIR}/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /builder/${FRONTEND_DIR}/nginx/security-header.conf.template /etc/nginx/security-header.conf.template
RUN envsubst < /etc/nginx/security-header.conf.template > /etc/nginx/security-header.conf

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 CMD [ "curl", "--fail", "http://localhost:3000/index.html" ]
