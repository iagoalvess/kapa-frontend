# Frontend — template React

Base para front-ends que consomem a API do template [backend](../backend): autenticação com
refresh rotativo, rotas protegidas, estado de servidor no React Query, formulários com Zod e
testes contra a API interceptada.

Só infraestrutura — **nenhuma tela de domínio**. O que existe aqui você usa em qualquer projeto;
o que for do seu produto entra em `src/features/`.

Feito para ser **copiado e renomeado**, não referenciado como biblioteca.

---

## Começar

```bash
npm install
cp .env.example .env.local    # aponte VITE_API_URL para a sua API
npm run dev
```

Aplicação em `http://localhost:5173`.

Suba o backend antes (`docker compose up` no repositório dele) e libere esta origem no CORS:

```bash
Cors__Origens__0=http://localhost:5173
```

Depois: [docs/nova-feature.md](docs/nova-feature.md) para criar a primeira tela.

### Comandos que o CI roda

```bash
npm run format:check    # Prettier
npm run lint            # oxlint
npm run typecheck       # tsc -b --noEmit
npm run test            # Vitest
npm run build           # tsc -b && vite build
```

Rodar os cinco antes de abrir PR evita a viagem de ida e volta.

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
| **Infra**       | Dockerfile multi-estágio, nginx com fallback de SPA, GitHub Actions, Dependabot |

Sem Axios, sem date-fns, sem Redux, sem biblioteca de UI. O que o navegador já
faz, o navegador faz.

---

## O que já vem pronto

|                         |                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Autenticação**        | Login, sessão restaurada no boot, logout com revogação no servidor.                                                                |
| **Renovação de token**  | Automática no 401, com **fila única** — o refresh rotativo do backend não tolera uso concorrente.                                  |
| **Autorização de tela** | `ExigeAutenticacao` e `ExigePerfil`, com o administrador passando por qualquer perfil.                                             |
| **Erros**               | `ProblemDetails` (RFC 9457) vira `ErroDaApi` com `codigo`, `status` e `traceId`; validação volta para o campo certo do formulário. |
| **Configuração**        | `VITE_*` validadas com Zod no boot — a aplicação não sobe mal configurada.                                                         |
| **Formatação**          | Data, moeda e número em pt-BR via `Intl`, com o UTC do backend tratado corretamente.                                               |
| **Pós-deploy**          | Chunk obsoleto recarrega sozinho; a versão do build aparece no rodapé.                                                             |
| **Acessibilidade**      | Salto para o conteúdo, foco gerenciado, rótulos ligados aos campos.                                                                |
| **Testes**              | 13 testes cobrindo a fila de renovação, a conversão de erro, o fluxo de login e formatação.                                        |

Telas: login e uma inicial de uma tela só, que existe para o ramo autenticado ter destino —
é a primeira coisa a substituir.

---

## Estrutura

```
src/
├── app/          rotas, guardas, layouts        (monta a aplicação)
├── features/     auth                           (o domínio; a sua entra ao lado)
├── components/   ui/ (shadcn) + layout/         (visual reusável)
├── config/       env, rotas, perfis
├── hooks/        usados por 2+ features
├── lib/          http, query, formato           (infraestrutura, sem domínio)
├── styles/       Tailwind e tokens da paleta
├── test/         setup, MSW, utilitários
└── types/        contrato compartilhado da API
```

Uma direção só: **`app` → `features` → `lib`**. `lib/` não conhece o domínio.

---

## Documentação

| Documento                                    | Para quê                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| [docs/arquitetura.md](docs/arquitetura.md)   | Por que cada escolha é essa, o que foi descartado e quando reabrir.     |
| [docs/padroes.md](docs/padroes.md)           | Como usar cada padrão no código, com exemplos. Referência de consulta.  |
| [docs/estrutura.md](docs/estrutura.md)       | Onde colocar cada arquivo. Tem tabela de referência rápida.             |
| [docs/nova-feature.md](docs/nova-feature.md) | Passo a passo para criar uma feature do zero.                           |
| [docs/operacao.md](docs/operacao.md)         | Build, deploy, CORS, variáveis, diagnóstico.                            |
| [docs/decisoes.md](docs/decisoes.md)         | As escolhas não óbvias, com o motivo e a condição que faria reabri-las. |

Começando no projeto: **arquitetura.md** para entender o desenho, **padroes.md** ao lado
enquanto escreve o primeiro código.

---

## Contrato com a API

| Endpoint                    | Onde é consumido                                                 |
| --------------------------- | ---------------------------------------------------------------- |
| `POST /api/v1/auth/login`   | `features/auth/api/auth.api.ts`                                  |
| `POST /api/v1/auth/logout`  | `features/auth/api/auth.api.ts`                                  |
| `POST /api/v1/auth/refresh` | `lib/http/sessao.ts` (fora do cliente, para não recursar no 401) |

O resto dos endpoints do backend — `/auth/registrar`, `/usuarios/*`, `/admin/*` — não está
consumido de propósito: cada projeto decide quais expõe e como. O molde para ligar um novo está
em [docs/nova-feature.md](docs/nova-feature.md).

Erro sai sempre em `ProblemDetails`, com `codigo` estável. **Ramifique por `codigo`, nunca pela
mensagem** — a mensagem é texto de produto e muda.
