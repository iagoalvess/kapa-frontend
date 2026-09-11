# Criando uma feature

Exemplo: uma tela de **Produtos**, com listagem paginada e criação.

A ordem importa — de dentro para fora. Começar pela tela leva a modelar o dado a partir do
layout, e o layout é a parte que mais muda.

Do lado do backend, a mesma feature está em `docs/nova-feature.md` daquele repositório. Os tipos
aqui espelham os DTOs de lá.

---

## 1. Tipos do contrato

`src/features/produtos/types/produtos.types.ts`

```ts
import type { PaginacaoRequest } from '@/types/paginacao'

/** Produto como aparece na listagem. Espelha `ProdutoResumoDTO`. */
export interface ProdutoResumo {
  id: string
  nome: string
  preco: number
  ativo: boolean
}

/** Espelha `ProdutoDetalheDTO`. */
export interface ProdutoDetalhe extends ProdutoResumo {
  criadoEm: string
}

/** Filtros de `GET /api/v1/produtos`. */
export interface FiltroDeProdutos extends PaginacaoRequest {
  busca?: string
}
```

Nomes de campo **iguais aos do JSON**, sem tradução e sem conversão de caso — a API responde em
`camelCase` e é assim que o TypeScript enxerga.

Data chega como `string` (ISO 8601, em UTC). Converta só na exibição.

---

## 2. Schema de validação

`src/features/produtos/schemas/produtos.schema.ts`

```ts
import { z } from 'zod'

export const esquemaDeProduto = z.object({
  nome: z.string().trim().min(1, 'O nome é obrigatório.').max(200),
  preco: z.coerce.number().positive('O preço deve ser maior que zero.'),
})

export type FormularioDeProduto = z.infer<typeof esquemaDeProduto>
```

Validação de **forma**. "Já existe produto com este nome" depende do banco e é do backend — vem
de volta como erro por campo e cai no formulário sozinho.

`z.coerce.number()` porque `<input>` sempre entrega string.

---

## 3. Chamadas à API

`src/features/produtos/api/produtos.api.ts`

```ts
import { api } from '@/lib/http/cliente'
import type { Pagina } from '@/types/paginacao'
import type { FiltroDeProdutos, ProdutoDetalhe, ProdutoResumo } from '../types/produtos.types'
import type { FormularioDeProduto } from '../schemas/produtos.schema'

const BASE = '/api/v1/produtos'

export function listarProdutos(filtro: FiltroDeProdutos, signal?: AbortSignal) {
  return api.get<Pagina<ProdutoResumo>>(BASE, {
    query: { pagina: filtro.pagina, tamanho: filtro.tamanho, busca: filtro.busca },
    signal,
  })
}

export function criarProduto(dados: FormularioDeProduto) {
  return api.post<ProdutoDetalhe>(BASE, { body: dados })
}
```

Sem React aqui: são funções `async` comuns, testáveis e reaproveitáveis fora de componente.

---

## 4. Chaves de cache e hooks

`src/features/produtos/hooks/chaves.ts`

```ts
export const chaves = {
  tudo: ['produtos'] as const,
  lista: (filtro: FiltroDeProdutos) => ['produtos', 'lista', filtro] as const,
  detalhe: (id: string) => ['produtos', 'detalhe', id] as const,
}
```

`src/features/produtos/hooks/useProdutos.ts`

```ts
export function useProdutos(filtro: FiltroDeProdutos) {
  return useQuery({
    queryKey: chaves.lista(filtro),
    queryFn: ({ signal }) => listarProdutos(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}

export function useCriarProduto() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: criarProduto,
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.tudo }),
  })
}
```

O filtro inteiro entra na chave. Chave incompleta devolve o resultado da busca anterior.

---

## 5. Página

`src/features/produtos/pages/ProdutosPage.tsx` — `export default`, porque o `lazy()` consome
o default.

O esqueleto de toda página de listagem:

```tsx
export default function ProdutosPage() {
  const [parametros, definirParametros] = useSearchParams()
  const pagina = Number(parametros.get('pagina') ?? '1')

  const produtos = useProdutos({ pagina, tamanho: 20 })

  if (produtos.isError) return <p role="alert">{mensagemDoErro(produtos.error)}</p>

  return /* … */
}
```

Página e busca vivem na URL, não em `useState`. Ver [padroes.md](padroes.md).

---

## 6. Rota

`src/config/rotas.ts`:

```ts
produtos: '/produtos',
produto: (id: string) => `/produtos/${id}`,
```

`src/app/router.tsx`, dentro do ramo autenticado:

```tsx
{
  path: ROTAS.produtos,
  lazy: pagina(() => import('@/features/produtos/pages/ProdutosPage')),
}
```

Se a tela for só de administrador, ponha dentro do ramo com `ExigePerfil` — e confirme que o
endpoint também exige, porque a guarda é navegação, não segurança.

Menu, se houver: `src/app/layouts/Cabecalho.tsx`.

---

## 7. Barrel

`src/features/produtos/index.ts`

```ts
export { useCriarProduto, useProdutos } from './hooks/useProdutos'
export type { FiltroDeProdutos, ProdutoDetalhe, ProdutoResumo } from './types/produtos.types'
```

Só o que outra camada pode usar. Página não entra — ela é carregada por caminho, no `lazy()`.

---

## 8. Testes

Um arquivo ao lado do que ele testa, cobrindo o que tem **decisão**:

- `pages/ProdutosPage.test.tsx` — a listagem renderiza o que a API devolveu; o erro aparece com
  `role="alert"`; o botão de próxima página fica desabilitado na última.
- `pages/NovoProdutoPage.test.tsx` — validação barra o envio; erro por campo vindo da API cai no
  campo certo.

Com MSW, nunca `vi.mock` do módulo de `api/`.

---

## Checklist

- [ ] Tipos espelham os DTOs, com os mesmos nomes de campo
- [ ] Schema valida forma; regra de negócio ficou no backend
- [ ] `api/` sem React e sem `fetch` direto
- [ ] Filtro inteiro dentro da `queryKey`
- [ ] `signal` repassado ao cliente HTTP
- [ ] Mutação invalida (ou atualiza) o que ficou velho
- [ ] Página com `export default` e carregada por `lazy()`
- [ ] Caminho novo em `config/rotas.ts`, nunca string solta
- [ ] Estado de filtro e paginação na URL
- [ ] Guarda de rota coerente com a autorização do endpoint
- [ ] Campos com rótulo ligado ao input (o teste e o leitor de tela dependem disso)
- [ ] `npm run lint && npm run typecheck && npm run test` passando
