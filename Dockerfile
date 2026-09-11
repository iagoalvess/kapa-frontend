# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
FROM node:24-alpine AS build

WORKDIR /app

# package.json + lock primeiro: a camada de dependências só é refeita quando eles mudam.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# O endereço da API é embutido no bundle — front estático não lê variável em tempo de execução.
# Uma imagem por ambiente, portanto. Se um dia precisar de imagem única, o caminho é servir um
# /config.js gerado no entrypoint; está registrado em docs/arquitetura.md.
ARG VITE_API_URL
ARG VITE_APP_NOME=Frontend
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NOME=$VITE_APP_NOME

RUN npm run build

# ---------------------------------------------------------------------------
# Runtime
# ---------------------------------------------------------------------------
FROM nginx:1.29-alpine AS runtime

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null || exit 1
