# Estrutura de pastas

Regra geral: **camada por pasta, feature por pasta dentro de `features/`.**
Uma feature nova nunca cria pasta de primeiro nível — cria `src/features/<feature>/`.

```
frontend/
├── index.html
├── vite.config.ts            # plugins, alias @, servidor de dev e configuração do Vitest
├── tsconfig.app.json         # regras do código de aplicação (o rigor mora aqui)
├── .oxlintrc.json            # regras de lint
├── components.json           # para o `npx shadcn add`
├── Dockerfile / nginx/       # imagem estática servida pelo nginx
├── docs/
└── src/
    ├── main.tsx              # ponto de entrada: restaura sessão e monta a árvore
    ├── app/                  # como a aplicação é montada
    ├── components/           # visual reusável entre features
    ├── config/               # env, rotas, perfis
    ├── features/             # o domínio
    ├── hooks/                # hooks usados por 2+ features
    ├── lib/                  # infraestrutura sem domínio
    ├── styles/               # Tailwind e tokens de tema
    ├── test/                 # setup, MSW e utilitários da suíte
    └── types/                # tipos compartilhados do contrato da API
```

## Grafo de dependências

```
app ──> features ──> lib
 │          │         ▲
 │          └─> components ──┘
 └─────────────────────┘
```

- **`lib/` não importa de `features/` nem de `app/`.** É a mesma inversão do backend, onde
  `Business` não referencia projeto algum.
- **`components/` não importa de `features/`.** Componente que precisa saber de uma feature não
  é compartilhado — é componente daquela feature.
- **`features/` não importa de outra `features/`.** Se duas precisam da mesma coisa, ela sobe
  para `components/`, `hooks/` ou `lib/`.

A regra tem um teste prático: se apagar a pasta de uma feature quebrar outra, a fronteira foi
violada.

---

## src/app — como a aplicação é montada

```
app/
├── providers.tsx             # QueryClientProvider + RouterProvider + Toaster. É a raiz.
├── router.tsx                # todas as rotas, cada página de feature em lazy()
├── guards/
│   ├── ExigeAutenticacao.tsx #   sem sessão -> /login, guardando o destino pretendido
│   └── ExigePerfil.tsx       #   sem o perfil -> início
├── layouts/
│   ├── LayoutApp.tsx         # barra lateral (gaveta no celular), título da rota, avatar
│   └── BarraLateral.tsx      # formatura, menu por seção, conta e versão do build
├── PaginaInicial.tsx         # destino do ramo autenticado; troque pela sua primeira tela
├── PaginaDeErro.tsx          # errorElement da raiz
└── PaginaNaoEncontrada.tsx   # rota "*"
```

`app/` é a única camada que conhece todas as features — é o trabalho dela. Nenhuma regra de
tela mora aqui.

### Por que toda página é `lazy`

Cada `lazy` vira um arquivo separado no build. Abrir a tela de login não baixa a listagem de
usuários. Por isso as páginas usam `export default`: é o que permite a linha única em
`router.tsx`.

---

## src/features — o domínio

```
features/
├── auth/                             # a única que vem pronta — login e logout
│   ├── api/auth.api.ts               # chamadas HTTP da feature
│   ├── hooks/useAutenticacao.ts      # useMutation / useQuery
│   ├── pages/LoginPage.tsx           # export default, carregada por lazy()
│   ├── schemas/auth.schema.ts        # Zod + o tipo do formulário (z.infer)
│   ├── types/auth.types.ts           # o contrato da API, espelhando os DTOs
│   └── index.ts                      # barrel: o que as outras camadas podem usar
└── <sua-feature>/                    # o molde: crie só as subpastas que usar
    ├── api/<feature>.api.ts
    ├── components/                   # componentes só desta feature
    ├── hooks/
    │   ├── chaves.ts                 # as query keys desta feature
    │   └── use<Feature>.ts
    ├── pages/
    ├── schemas/
    ├── types/
    └── index.ts
```

### O contrato de uma feature

| Subpasta          | Contém                     | Regra                                                                 |
| ----------------- | -------------------------- | --------------------------------------------------------------------- |
| `api/`            | funções que chamam a API   | Usam `api` de `lib/http/cliente`. Sem `fetch` direto, sem React aqui. |
| `hooks/`          | `useQuery` / `useMutation` | É o único lugar que chama `api/`. Componente não chama API.           |
| `hooks/chaves.ts` | as query keys              | Por feature, nunca global — invalidar é decisão da feature.           |
| `pages/`          | telas                      | `export default`, para o `lazy()`. Uma página por rota.               |
| `components/`     | componentes da feature     | Sobe para `src/components/` só quando a segunda feature usar.         |
| `schemas/`        | Zod                        | Valida **forma**. Regra de negócio é do backend.                      |
| `types/`          | tipos do contrato          | Espelham os DTOs da API, com o mesmo nome de campo.                   |
| `index.ts`        | barrel                     | Só o que é público. Página não entra — ela é carregada por caminho.   |

**Pasta de feature no plural** (`produtos/`), **tipo no singular** (`ProdutoResumo`) — a mesma
convenção do backend.

### O caminho de um dado

```
componente  ->  hook (useQuery)  ->  api/*.api.ts  ->  lib/http/cliente  ->  API
```

Nenhum passo pode ser pulado. Componente que chama `api/` direto perde cache, estado de
carregando, repetição e cancelamento — e reimplementa os quatro, pior, em `useEffect`.

---

## src/lib — infraestrutura

```
lib/
├── http/
│   ├── cliente.ts            # o cliente HTTP: base URL, JSON, auth, timeout, erros
│   ├── erros.ts              # ProblemDetails -> ErroDaApi / ErroDeRede
│   ├── sessao.ts             # dono dos tokens, com renovação em fila única
│   ├── jwt.ts                # leitura das claims do access token
│   └── formulario.ts         # erros da API -> setError do react-hook-form
├── query/
│   └── client.ts             # QueryClient e seus padrões (staleTime, retry)
├── formato.ts                # data, moeda e número em pt-BR, via Intl
└── utils.ts                  # cn()
```

Nada aqui conhece `Usuario`, `Perfil` ou qualquer conceito do produto. É o que permite copiar
`lib/` inteiro para o próximo projeto.

---

## src/config — o que é configuração, não código

| Arquivo     | Para quê                                                                   |
| ----------- | -------------------------------------------------------------------------- |
| `env.ts`    | As variáveis `VITE_*`, validadas com Zod na carga do módulo.               |
| `rotas.ts`  | Todo caminho da aplicação. `<Link to={ROTAS.inicio}>`, nunca string solta. |
| `perfis.ts` | Os perfis do backend. Espelha `PerfisPadrao`.                              |

---

## src/components — visual compartilhado

```
components/
├── ui/                       # shadcn/ui vendorizado. NÃO edite por estilo; edite por necessidade.
└── layout/
    └── LogoKapa.tsx
```

A `BarraLateral` mora em `app/layouts/`, e não aqui: ela monta peças de features (seletor de
formatura, sair), e `components/` não importa de `features/`.

`ui/` está fora do Prettier e do oxlint: é código de terceiro, atualizado por
`npx shadcn@latest add <componente>`.

Adicione um componente em `components/` quando **a segunda** feature precisar dele. Antes disso
ele mora na feature que o usa. Pasta de compartilhados preenchida por antecipação vira depósito.

---

## src/test

```
test/
├── setup.ts                  # jest-dom, ciclo do MSW, limpeza entre testes
├── msw/server.ts             # servidor sem handlers: cada teste declara os seus
└── utils.tsx                 # renderizar(): roteador + QueryClient novos por teste
```

O teste fica **ao lado do código** (`cliente.test.ts` junto de `cliente.ts`), não numa árvore
paralela. Achar o teste de um arquivo nunca deve exigir busca.

---

## Onde colocar cada coisa (referência rápida)

| Vou escrever...                  | Vai em                                                 |
| -------------------------------- | ------------------------------------------------------ |
| tela nova                        | `features/<feature>/pages/` + rota em `app/router.tsx` |
| chamada a um endpoint            | `features/<feature>/api/<feature>.api.ts`              |
| `useQuery` / `useMutation`       | `features/<feature>/hooks/`                            |
| tipo de um DTO da API            | `features/<feature>/types/`                            |
| validação de formulário          | `features/<feature>/schemas/`                          |
| componente usado por 1 feature   | `features/<feature>/components/`                       |
| componente usado por 2+ features | `src/components/`                                      |
| componente do shadcn             | `npx shadcn@latest add <nome>` → `src/components/ui/`  |
| hook usado por 2+ features       | `src/hooks/`                                           |
| coisa de rede, sessão ou erro    | `src/lib/http/`                                        |
| caminho de rota                  | `src/config/rotas.ts`                                  |
| variável de ambiente             | `.env.example` + `src/config/env.ts`                   |
| token de cor, raio, fonte        | `src/styles/index.css`, dentro de `@theme`             |
