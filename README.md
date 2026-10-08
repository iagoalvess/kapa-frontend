# Kapa — frontend

O app (`index.html`, em `app.kapaformaturas.com.br`) e o site público — landing e documentos legais
(`site.html`, pré-renderizado, em `kapaformaturas.com.br`). Consome a API do repositório irmão
[backend](../backend). Deploy e domínios em `docs/operacao/deploy.md` na raiz do projeto.

---

## Começar

```bash
npm install
cp .env.example .env.local    # VITE_API_URL, VITE_APP_URL, VITE_SITE_URL
npm run dev                   # o app, em http://localhost:5173
npm run dev:site              # o site, em http://localhost:5180
```

Suba o backend antes e libere as origens no CORS (`Cors__Origens__0=http://localhost:5173`).

### Antes de dar por pronto

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test
npm run build          # o app (dist/)
npm run build:site     # o site pré-renderizado (dist-site/)
```

---

## Stack

|                 |                                                                                 |
| --------------- | ------------------------------------------------------------------------------- |
| **Base**        | React 19 + TypeScript 6 + Vite 8                                                |
| **Rotas**       | React Router 8 (data router), uma página por `lazy()`                           |
| **Dados**       | TanStack Query 5 — o único dono de dado vindo da API                            |
| **HTTP**        | Cliente próprio sobre `fetch`: base URL, JSON, token, timeout, `ProblemDetails` |
| **Formulários** | React Hook Form + Zod, com erro por campo vindo da API                          |
| **Visual**      | Tailwind CSS 4 (configurado em CSS) + shadcn/ui vendorizado + Lucide            |
| **Performance** | React Compiler — memoização manual é proibida                                   |
| **Qualidade**   | oxlint + Prettier + Husky/lint-staged no pre-commit                             |
| **Testes**      | Vitest + Testing Library + MSW                                                  |
| **Infra**       | Cloudflare Pages (`borda/_headers`), GitHub Actions, Dependabot                 |

Sem Axios, sem date-fns, sem Redux, sem biblioteca de UI. O que o navegador já faz, o navegador faz.

---

## Documentação

| Documento                                    | Para quê                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| [CLAUDE.md](CLAUDE.md)                       | As regras fixas e o catálogo de peças de tela, em resumo.               |
| [docs/arquitetura.md](docs/arquitetura.md)   | Por que cada escolha é essa, o que foi descartado e quando reabrir.     |
| [docs/decisoes.md](docs/decisoes.md)         | As escolhas não óbvias, com o motivo e a condição que faria reabri-las. |
| [docs/padroes.md](docs/padroes.md)           | Como usar cada padrão no código, com exemplos. Referência de consulta.  |
| [docs/estrutura.md](docs/estrutura.md)       | Onde colocar cada arquivo. Tem tabela de referência rápida.             |
| [docs/nova-feature.md](docs/nova-feature.md) | Passo a passo para criar uma feature do zero.                           |
| [docs/operacao.md](docs/operacao.md)         | Build, variáveis, CORS, sessão em produção, diagnóstico.                |

Erro da API sai sempre em `ProblemDetails`, com `codigo` estável. **Ramifique por `codigo`, nunca
pela mensagem** — a mensagem é texto de produto e muda.
