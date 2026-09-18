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

# Template, e não conf pronta: o entrypoint do nginx roda envsubst em /etc/nginx/templates e
# escreve o resultado em /etc/nginx/conf.d. É o que põe o endereço da API na CSP sem uma imagem
# por domínio. `$uri` e `$csp` sobrevivem porque envsubst só troca o que existe no ambiente.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# A CSP precisa liberar a origem da API em connect-src. O ARG é redeclarado porque um ARG vale
# só no estágio onde aparece, e o padrão acompanha o VITE_API_URL do build — é o mesmo endereço.
# Em produção dá para sobrescrever no compose, sem rebuildar, com a variável API_ORIGIN.
ARG VITE_API_URL
ENV API_ORIGIN=$VITE_API_URL

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null || exit 1
