# CLAUDE.md

Orientações para o Claude Code neste repositório.

## O que é este projeto

Template de front-end React 19 + TypeScript + Vite, consumindo a API do template `backend`
(irmão deste repositório). Autenticação JWT com refresh rotativo, React Query como único dono de
dado de servidor, Tailwind v4 + shadcn/ui.

**Antes de mexer na arquitetura, leia `docs/arquitetura.md`**, e mantenha `docs/padroes.md` à mão
enquanto escreve — ele traz o uso correto de cada padrão do projeto, com exemplos.

## Comandos

```bash
npm run dev
npm run format:check     # Prettier
npm run lint             # oxlint
npm run typecheck        # tsc -b --noEmit
npm run test             # Vitest
npm run build            # tsc -b && vite build

npx shadcn@latest add <componente>    # entra em src/components/ui/
```

Antes de dar por pronto: `npm run format:check && npm run lint && npm run typecheck && npm run test`.

## Regras fixas

Estas são convenções estabelecidas. Não desvie sem discutir antes.

### Direção da dependência

`app` → `features` → `lib`. `lib/` não importa de `features/` nem de `app/`. `components/` não
importa de `features/`. Uma feature não importa de outra — o que duas precisam sobe para
`components/`, `hooks/` ou `lib/`.

Teste prático: apagar a pasta de uma feature não pode quebrar outra.

### Nenhum `fetch` fora de `lib/http`

Toda chamada usa `api` de `@/lib/http/cliente`. A exceção documentada é a renovação de token em
`sessao.ts`, que usa `fetch` cru de propósito — passar pelo cliente criaria recursão no 401.

### Componente não chama API

`componente → hook (useQuery/useMutation) → api/*.api.ts → lib/http/cliente`. Nenhum passo pode
ser pulado. Nada de `useEffect` para buscar dado.

### Sem memoização manual

O React Compiler está ligado. Não escreva `useMemo`, `useCallback` nem `React.memo`. Exceção:
estabilizar referência que sai do React (instância de classe, `AbortController`) — ali é
identidade, não otimização.

### Ramifique por `codigo`, nunca por mensagem

`ErroDaApi.codigo` é contrato estável do backend. `message` é texto de produto e muda.

### Validação vive uma vez

Schema Zod valida **forma** (obrigatório, formato, tamanho). Política de senha e regra de
negócio ficam só no backend. O tipo do formulário vem de `z.infer`, nunca escrito à mão.

### Token nunca vai para o armazenamento do navegador

O access token fica em memória; o refresh token é cookie `HttpOnly` que este código não enxerga.
`sessao.ts` não usa `localStorage` — há teste que falha se alguém gravar. "Consertar o F5"
persistindo token é exatamente o que a mudança para cookie desfez.

Toda chamada leva `credentials: 'include'`, senão o cookie não acompanha entre origens.

### Guarda de rota é navegação, não segurança

`ExigeAutenticacao`/`ExigePerfil` decidem para onde o usuário vai. Quem autoriza é a API. Nunca
traga para o front dado que o usuário não pode ver e o esconda com `if`.

### Estado de filtro vive na URL

Página, busca, aba e filtro vão para a query string (`useSearchParams`). `useState` só para o
que é efêmero de verdade — menu aberto, campo em digitação.

### Rota nunca é string solta

Todo caminho entra em `config/rotas.ts` antes de ser usado.

### Data, moeda e número passam por `lib/formato`

`formatarData`, `formatarDataHora`, `formatarMoeda`, `formatarNumero`. Nunca `toLocaleString`
solto na tela, nunca `new Date(iso)` direto — string sem fuso é lida como hora local e a data
aparece um dia atrás.

### Cor só por token

`bg-background`, `text-muted-foreground`. Cor literal (`text-[#1d4ed8]`) quebra o tema escuro,
que é aplicado em `main.tsx` antes do primeiro render.

### Sem `any`, sem `console`

O lint barra os dois. Tipo desconhecido é `unknown` com estreitamento.

### `src/components/ui/` é código de terceiro

Vendorizado do shadcn, fora do Prettier e do oxlint. Edite por necessidade real, nunca por
estilo — reformatar torna ilegível o diff do próximo `npx shadcn add`.

### Comentário explica por quê

Bloco JSDoc acima de função exportada, com `@param`/`@returns` quando ajudar. Comentário dentro
do corpo só quando a linha esconde uma razão não óbvia. Nada que repita o nome da função.

### Idioma

Domínio em português (`useProdutos`, `FiltroDeProdutos`, `esquemaDeLogin`), termo consagrado de
framework em inglês (`components`, `hooks`, `schemas`, `props`, `queryKey`).

## Estrutura

Camada por pasta, feature por pasta dentro de `features/`. Feature nova nunca cria pasta de
primeiro nível.

```
features/<feature>/{api,hooks,pages,schemas,types,components}/ + index.ts
```

Pasta de feature no plural (`produtos/`), tipo no singular (`ProdutoResumo`).

Detalhes em `docs/estrutura.md`; passo a passo em `docs/nova-feature.md`.

## Ao criar uma feature

Ordem: tipos → schema → `api/` → chaves + hooks → página → rota → barrel → testes.

Nada precisa de registro em lugar nenhum. A rota é o único ponto de amarração, em
`app/router.tsx`, e a página usa `export default` porque o `lazy()` consome o default.

## Testes

Vitest + Testing Library + MSW. Arquivo `*.test.ts(x)` ao lado do código testado.

- A API é interceptada pelo **MSW**, nunca por `vi.mock` do módulo de `api/`.
- Busque como o usuário: `getByRole`, `getByLabelText`. `data-testid` é último recurso.
- `userEvent`, não `fireEvent`.
- O MSW roda com `onUnhandledRequest: 'error'` — requisição não declarada derruba o teste.

Teste onde há decisão: um `if`, um cálculo, um fluxo de erro, uma regra de permissão. Tela que só
desenha props não precisa de teste próprio.
