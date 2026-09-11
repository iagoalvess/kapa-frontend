# Padrões de código

Como usar cada padrão deste projeto, com exemplo. Mantenha aberto enquanto escreve.

O **porquê** de cada escolha está em [arquitetura.md](arquitetura.md). Aqui é o _como_.

---

## O cliente HTTP

Toda chamada à API passa por `api`, de `@/lib/http/cliente`. Nenhuma feature usa `fetch`.

```ts
import { api } from '@/lib/http/cliente'

const produto = await api.get<ProdutoDetalhe>('/api/v1/produtos/123')

await api.put<ProdutoDetalhe>('/api/v1/produtos/123', { body: { nome: 'Caneta' } })

await api.get<Pagina<ProdutoResumo>>('/api/v1/produtos', {
  query: { pagina: 2, tamanho: 20, busca: undefined }, // undefined não vai na query string
  signal, // o que o React Query passa; cancela a requisição ao desmontar
})
```

O que ele já faz por você:

|                                   |                                                                        |
| --------------------------------- | ---------------------------------------------------------------------- |
| Base URL                          | de `env.VITE_API_URL`                                                  |
| `Content-Type` e `JSON.stringify` | quando há `body`                                                       |
| `Authorization: Bearer`           | quando há sessão (`autenticar: false` desliga)                         |
| Renovação no 401                  | uma vez, com fila compartilhada                                        |
| Tempo limite                      | 30 s, ajustável em `tempoLimite`                                       |
| `204 No Content`                  | devolve `undefined`, sem estourar no `.json()`                         |
| Erro                              | vira `ErroDaApi` ou `ErroDeRede` — nunca um `Response` com `ok: false` |

---

## Tratando erro

```ts
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'

try {
  await api.post('/api/v1/produtos', { body: dados })
} catch (erro) {
  if (ehErroDaApi(erro) && erro.codigo === 'produto.nome_em_uso') {
    // caso específico, tratado de propósito
  }
  toast.error(mensagemDoErro(erro))
}
```

**Ramifique por `codigo`, nunca por `message`.** O código é contrato do backend; a mensagem é
texto de produto e muda sem aviso.

Na prática você raramente escreve `try/catch`: o React Query entrega o erro em `query.error` e
em `onError` da mutação.

---

## Consultando: `useQuery`

Sempre dentro de `features/<feature>/hooks/`.

```ts
export function useProdutos(filtro: FiltroDeProdutos) {
  return useQuery({
    queryKey: chaves.lista(filtro),
    queryFn: ({ signal }) => listarProdutos(filtro, signal),
    placeholderData: (anterior) => anterior, // a tabela não pisca ao trocar de página
  })
}
```

Três regras:

1. **O filtro inteiro entra na `queryKey`.** Chave que não reflete o que a consulta usa devolve
   o resultado da busca anterior — o bug mais comum e mais difícil de enxergar.
2. **Repasse o `signal`.** Sair da tela cancela a requisição em vez de gastar rede e tentar
   escrever em componente desmontado.
3. **Nada de `useEffect` para buscar dado.** Se está escrevendo `useEffect(() => { fetch...`,
   pare: é exatamente o que o `useQuery` faz, com cache, cancelamento e repetição.

Na tela:

```tsx
const produtos = useProdutos({ pagina, tamanho: 20 })

if (produtos.isPending) return <p>Carregando…</p>
if (produtos.isError) return <p role="alert">{mensagemDoErro(produtos.error)}</p>

return <Tabela itens={produtos.data.itens} />
```

Depois dos dois `if`, `produtos.data` é garantido pelo TypeScript. Sem eles, você escreve `?.`
em toda linha e some com o estado de erro.

---

## Alterando: `useMutation`

```ts
export function useAtualizarProduto() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: atualizarProduto,
    onSuccess: (produto) => {
      cliente.setQueryData(chaves.detalhe(produto.id), produto) // a resposta traz o estado final
      void cliente.invalidateQueries({ queryKey: chaves.tudo }) // o resto recarrega
    },
  })
}
```

- `setQueryData` quando a API devolve o recurso atualizado — evita uma ida a mais.
- `invalidateQueries` para o que ficou desatualizado em outras telas.
- `onSuccess`/`onError` **da mutação** para efeito que vale sempre; **da chamada**
  (`mutate(valores, { onError })`) para o que é daquela tela, como pôr erro no formulário.

Mutação não repete automaticamente (`retry: false` no cliente): um POST repetido cria o
registro duas vezes.

---

## Query keys

Uma por feature, em `features/<feature>/hooks/chaves.ts`:

```ts
export const chaves = {
  tudo: ['produtos'] as const,
  lista: (filtro: FiltroDeProdutos) => ['produtos', 'lista', filtro] as const,
  detalhe: (id: string) => ['produtos', 'detalhe', id] as const,
}
```

O prefixo comum é o que permite `invalidateQueries({ queryKey: chaves.tudo })` derrubar a
feature inteira de uma vez. `as const` faz o TypeScript reclamar de chave escrita errado.

---

## Formulários

React Hook Form + Zod + os componentes `Form*`. O tipo vem do schema, nunca escrito à mão.

```tsx
const formulario = useForm<FormularioDeLogin>({
  resolver: zodResolver(esquemaDeLogin),
  defaultValues: { email: '', senha: '' },
})

const enviar = formulario.handleSubmit((valores) => {
  entrar.mutate(valores, {
    onError: (erro) => {
      if (!aplicarErrosDaApi(erro, formulario.setError)) {
        formulario.setError('root', { message: mensagemDoErro(erro) })
      }
    },
  })
})
```

```tsx
<Form {...formulario}>
  <form onSubmit={enviar} noValidate>
    <FormField
      control={formulario.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>E-mail</FormLabel>
          <FormControl>
            <Input type="email" autoComplete="username" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

- **`defaultValues` sempre.** Sem eles o campo começa não controlado e o React avisa no console
  no primeiro caractere digitado.
- **`noValidate` no `<form>`.** A validação é a do Zod; a do navegador mostraria um balão em
  outro idioma e com outra regra.
- **`FormLabel` de verdade**, ligado ao campo. É o que faz `getByLabelText` funcionar no teste —
  e leitor de tela, no mundo real.
- **`aplicarErrosDaApi`** devolve `true` quando encontrou erro por campo; só aí você dispensa a
  mensagem geral.

Preenchendo com dado carregado:

```tsx
const { reset } = formulario
useEffect(() => {
  if (perfil.data) reset({ nome: perfil.data.nome })
}, [perfil.data, reset])
```

---

## Rotas

Caminho novo entra em `config/rotas.ts` **antes** de ser usado:

```ts
export const ROTAS = {
  produtos: '/produtos',
  produto: (id: string) => `/produtos/${id}`,
} as const
```

```tsx
<Link to={ROTAS.produto(produto.id)}>{produto.nome}</Link>
```

E a rota, em `app/router.tsx`:

```tsx
{
  path: ROTAS.produtos,
  lazy: pagina(() => import('@/features/produtos/pages/ProdutosPage')),
}
```

Restrita a um perfil? Envolva num ramo com guarda:

```tsx
{
  Component: () => <ExigePerfil perfil={PERFIS.administrador} />,
  children: [ /* rotas restritas */ ],
}
```

---

## Estado de tela vive na URL

Filtro, página, aba selecionada e termo de busca vão para a query string:

```tsx
const [parametros, definirParametros] = useSearchParams()
const pagina = Number(parametros.get('pagina') ?? '1')
```

Recarregar, voltar e mandar o link para um colega devolvem a mesma tela. `useState` para isso
perde as três coisas — e é o motivo de "me manda o print, o link não abre no mesmo lugar".

`useState` continua certo para o que é efêmero de verdade: um menu aberto, um campo em digitação.

---

## Sessão e perfil

```tsx
const { usuario, autenticado } = useSessao()
const { ehAdministrador, tem } = usePerfil()

{
  tem(PERFIS.administrador) ? <Item para={ROTAS.produtos}>Produtos</Item> : null
}
```

Serve para **mostrar ou esconder**. Não é controle de acesso: a API decide. Nunca traga para o
front um dado que só administrador pode ver e o esconda com `if` — ele já viajou pela rede.

---

## Estilo

Tailwind, com os tokens do tema. Sem arquivo `.css` por componente, sem `style={{}}`.

```tsx
<div className="bg-card text-card-foreground rounded-lg border p-4" />
```

Classe condicional é `cn`, que resolve conflito do Tailwind — a última vence:

```tsx
<button className={cn('px-2', ativo && 'px-4 font-medium', className)} />
```

Cor, raio ou fonte nova entra em `src/styles/index.css`, dentro de `@theme`. Cor escrita direto
na classe (`text-[#1d4ed8]`) é a forma de ter sete azuis diferentes em seis meses.

---

## Data, moeda e número

Nunca monte o texto na mão. Tudo passa por `@/lib/formato`:

```tsx
import { formatarData, formatarDataHora, formatarMoeda, formatarNumero } from '@/lib/formato'

<td>{formatarData(produto.criadoEm)}</td>      {/* 31/12/2026 */}
<td>{formatarDataHora(produto.criadoEm)}</td>  {/* 31/12/2026 14:05 */}
<td>{formatarMoeda(produto.preco)}</td>        {/* R$ 1.234,56 */}
<td>{formatarNumero(produto.estoque)}</td>     {/* 1.234 */}
```

Valor ausente ou ilegível vira `—`, sem `?.` e sem `??` na tela.

O detalhe que justifica o módulo: o backend grava em **UTC**, e string sem marca de fuso é lida
pelo navegador como hora **local**. No Brasil isso joga a data três horas para trás e troca o dia
de toda operação feita à noite. `formato.ts` normaliza isso num lugar só — há teste cobrindo.

Data é exibida no fuso de quem está olhando, sempre. Se algum dia precisar fixar um fuso (relatório
que tem de bater com o fechamento do servidor), o parâmetro entra aqui, não em cada tela.

---

## Tema claro e escuro

```tsx
const [tema, alternarTema] = useTema()
```

O tema é aplicado em `main.tsx` **antes** do primeiro render — aplicar dentro do React produz o
flash branco. A primeira visita segue a preferência do sistema operacional; a partir daí vale a
escolha guardada.

Componente nenhum precisa saber do tema: as cores vêm dos tokens (`bg-background`,
`text-muted-foreground`), que já trocam junto. Cor escrita direto na classe é o que quebra o
modo escuro.

---

## Componentes

```tsx
function Cartao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-medium">{titulo}</h2>
      {children}
    </section>
  )
}
```

- **Sem `useMemo`, `useCallback` ou `React.memo`.** O React Compiler faz isso. Ver
  [arquitetura.md](arquitetura.md).
- **Props tipadas inline** quando são poucas; `interface` própria quando passam de quatro ou são
  reaproveitadas.
- **`export default` só em página** (é o que o `lazy()` consome). Todo o resto é export nomeado.
- **Componente não chama API.** Ele chama um hook, que chama `api/`.

---

## Testes

Um arquivo `*.test.ts(x)` ao lado do código. O que se testa é comportamento, não implementação.

```tsx
it('mostra a mensagem que a API devolveu quando as credenciais não conferem', async () => {
  servidor.use(http.post(LOGIN, () => HttpResponse.json({ detail: '…' }, { status: 401 })))

  renderizar(<LoginPage />)

  await userEvent.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('…')
})
```

- **Busque como o usuário busca:** `getByRole`, `getByLabelText`, `findByText`. `data-testid`
  é o último recurso — e sinal de que falta um rótulo acessível.
- **`userEvent`, não `fireEvent`.** Ele dispara a sequência real de eventos (foco, tecla,
  clique); `fireEvent` aprova código que quebra no navegador.
- **A API é mockada no MSW**, nunca com `vi.mock` do módulo de `api/`.
- **`findBy*` em vez de `waitFor` + `getBy*`** quando você só espera algo aparecer.

Não é preciso testar tudo. Vale o teste onde há **decisão**: um `if`, um cálculo, um fluxo de
erro, uma regra de permissão. Tela que só desenha props não precisa de teste próprio.

---

## Comentários

A mesma regra do backend: o comentário explica **por quê**, não o quê.

```ts
// Renovar três vezes dispararia a detecção de reúso do backend e derrubaria a sessão.
expect(renovacoes).toBe(1)
```

Use bloco JSDoc (`/** */`) acima de função exportada, com `@param` e `@returns` quando ajudar —
é o que a IDE mostra em quem chama. Comentário que repete o nome da função (`// busca usuários`
acima de `buscarProdutos`) é ruído: apague.
