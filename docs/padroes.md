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
  mensagem geral. Na prática use `exibirErroNoFormulario(erro, formulario.setError)`, que já faz os
  dois.
- **`<ErroDoFormulario />`** desenha o `errors.root`, dentro do `<Form>`. Não repita o `<p
role="alert">` na tela.
- **`<AcoesDoFormulario />`** é o rodapé (Cancelar + o principal), e `<DialogoDeFormulario>` é a
  casca quando o formulário mora num diálogo.
- **`formState` não se lê solto** quando o valor decide algo (um botão desabilitado por `isDirty`):
  assine com `useFormState({ control })`. Ver a regra no `CLAUDE.md`.

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
<LinkDaPagina to={ROTAS.produto(produto.id)}>{produto.nome}</LinkDaPagina>
```

E a rota, em `app/router.tsx`:

```tsx
{
  path: ROTAS.produtos,
  lazy: pagina(() => import('@/features/produtos/pages/ProdutosPage')),
}
```

Atalhos no conteúdo usam `LinkDaPagina`, de `components/`: ele guarda a URL e o título da origem
(`handle.titulo`) e o `LayoutApp` mostra a seta abaixo do título da próxima tela. Para navegação
imperativa, leia `useEstadoComOrigem()` no topo do componente e passe o resultado como `state` ao `navigate`.
`LinkDeVolta` continua como saída fixa para acesso direto; a moldura evita duplicá-lo quando há origem.
Filtros preservam o `state` da localização, inclusive no `Navigate` que corrige uma página fora da faixa.
Abrir, cancelar ou concluir um editor na mesma tela também preserva a rolagem: ao mudar a query string,
passe `{ state, preventScrollReset: true }` para `setSearchParams`. Trocar de página continua começando
do topo, e voltar/avançar restaura a posição anterior pelo `ScrollRestoration`.
Os links do menu continuam usando `Link`/`NavLink`, pois escolhem uma seção sem criar um caminho de volta.

Restrita a um perfil? Envolva num ramo com guarda:

```tsx
{
  Component: () => <ExigePerfil perfil={PERFIS.administrador} />,
  children: [ /* rotas restritas */ ],
}
```

### Área que o plano da turma pode não incluir

A área que a API guarda com `[ExigeModulo]` ganha três coisas no front (Sprint 45):

- **A rota**, num ramo com `<ExigeModulo modulo={MODULOS.x} />`. Fora do plano, ele desenha a
  `AreaBloqueada` — maquete desfocada e o convite a contratar — no lugar da página, que nem monta.
- **As consultas** que outras telas fazem dela esperam o plano: `enabled: inclui(MODULOS.x)`, de
  `usePlanoDaTurma`. Sem isso, a tela da turma gratuita dispara o pedido e leva 403.
- **O item de menu** leva `trancado={bloqueia(MODULOS.x)}` para a Gestão, e some para o formando.

A vitrine da área mora em `AREAS_DO_PLANO` (`config/planos.ts`). **A maquete é revisada junto com a tela
real**: maquete que mostra o que a área não faz é propaganda enganosa. Mudar o que um plano libera é
editar `planos.modulos` no banco; o front lê de lá.

Qualquer código de plano que ainda chegue (`plano.modulo_nao_incluido`, `convite.formatura_nao_contratada`,
`plano.limite_de_formandos`) vira o `DialogoDeUpgrade` por dentro de `avisarErro` e
`exibirErroNoFormulario`: a tela não trata nenhum deles à mão.

---

## Estado de tela vive na URL

Filtro, página, aba selecionada e termo de busca vão para a query string:

```tsx
const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()

const situacao = parametros.get('situacao')
const despesas = useDespesas({ pagina, busca: busca || undefined, situacao })

// Filtro novo volta à página 1; paginar passa `pagina` explícito, que vence.
<Chip ativo={!situacao} onClick={() => atualizar({ situacao: null })}>Todas</Chip>
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

`tem` confere **só** o perfil pedido: o administrador não é coringa (Sprint 44, D4), como em
`Politicas.ExigirPerfil`. Ele é perfil de plataforma, mora no painel (`/painel`, menu próprio via
`useNoPainel`) e não vê a gestão das turmas; o login o leva para lá pela guarda `ExigeFormatura`.

---

## Coluna lateral

Tela de detalhe com uma ação principal — o cadastro de um lado, o estado e o que se faz com ele do outro —
usa a grade `grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]`: conteúdo à
esquerda (cartão principal com ícone, listas em `Tabela emLista`), e à direita o cartão lateral sem ícone,
com as ações em `Button size="sm"` (no cabeçalho do `Cartao` quando é uma, embaixo da `ListaDeDados` quando
são várias). Exemplos: `PaginaDaFormatura`, `PlanoDeCobrancaPage`, e a turma e a conta do painel.

Textos de apoio e orientações usam `TextoDoCartao`, de `components/Cartao`: 15 px e a mesma entrelinha
das descrições. Ele aceita `as="div"`, `as="ul"` e `as="ol"` para notas compostas e listas de instruções.
Descrições com vários parágrafos passam os elementos `<p>` em `descricao`, com `mt-3` entre eles.

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
import { formatarCentavos, formatarData, formatarDataHora, formatarNumero } from '@/lib/formato'

<td>{formatarData(produto.criado_em)}</td>                 {/* 31/12/2026 */}
<td>{formatarDataHora(produto.criado_em)}</td>             {/* 31/12/2026 14:05 */}
<td>{formatarCentavos(produto.preco_em_centavos)}</td>     {/* R$ 1.234,56 */}
<td>{formatarNumero(produto.estoque)}</td>                 {/* 1.234 */}
```

Valor ausente ou ilegível vira `—`, sem `?.` e sem `??` na tela.

O detalhe que justifica o módulo: o backend grava em **UTC**, e string sem marca de fuso é lida
pelo navegador como hora **local**. No Brasil isso joga a data três horas para trás e troca o dia
de toda operação feita à noite. `formato.ts` normaliza isso num lugar só — há teste cobrindo.

Data é exibida no fuso de quem está olhando, sempre. Se algum dia precisar fixar um fuso (relatório
que tem de bater com o fechamento do servidor), o parâmetro entra aqui, não em cada tela.

---

## Sem modo escuro

O produto é claro, laranja sobre branco — não existe tema escuro nem alternador. `:root` declara
`color-scheme: light` para o navegador não escurecer controles nativos quando o sistema
operacional está em dark. Cor vem sempre de token (`bg-background`, `text-muted-foreground`),
nunca literal.

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

- **Antes de escrever, olhe `src/components/`.** O catálogo do que já existe — diálogo de
  confirmação, rodapé de formulário, planilha, cartão, selo, estados de consulta — está no
  `CLAUDE.md`. Variação entra como prop no que existe, não como cópia ao lado.
- **Sem `useMemo`, `useCallback` ou `React.memo`.** O React Compiler faz isso. Ver
  [arquitetura.md](arquitetura.md).
- **Props tipadas inline** quando são poucas; `interface` própria quando passam de quatro ou são
  reaproveitadas.
- **`export default` só em página** (é o que o `lazy()` consome). Todo o resto é export nomeado.
- **Componente não chama API.** Ele chama um hook, que chama `api/`.

---

## Celular

Desde a Sprint 41 o celular (abaixo de `lg`, 1024px) tem desenho próprio, e **ele mora nas peças, não
nas telas**. Tela nova montada com as peças do catálogo já sai certa no celular; nenhuma tela escreve
`if` de largura.

| No celular                                                          | Quem resolve                                                                                    |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Barra de baixo com 4 destinos do papel + "Mais"                     | `BarraInferior` (`app/layouts`); destinos novos entram lá                                       |
| Menu inteiro e busca                                                | folha "Mais" do `LayoutApp` (a `BarraLateral` inteira)                                          |
| Tabela vira lista (título + ação em cima, dados embaixo)            | `Tabela emLista` — a `Planilha` já passa                                                        |
| Cinco por página e paginação compacta                               | `useTamanhoDaPagina` (`hooks/useTelaGrande`) + `Paginacao`                                      |
| Só dois números na faixa, o resto em "Ver detalhes"                 | `FaixaDeIndicadores` — ponha os dois mais importantes antes                                     |
| Ação principal presa acima da barra                                 | `AcaoFixa` (`components/layout`) — só quando é **uma**                                          |
| Orientações longas ficam disponíveis numa seção expansível          | `Cartao recolhivelNoCelular`; descrições continuam visíveis                                     |
| Destinos relacionados após os indicadores, antes da busca e filtros | `AtalhosDaPagina`, em faixa laranja de canto a canto, com divisórias e toque de pelo menos 56px |
| Próxima ação financeira antes da busca e filtros                    | Resumo compartilhado com a lateral, montado uma vez conforme `useTelaGrande`                    |
| Filtro atual e ação na mesma linha, outros filtros no painel        | `FiltrosDaPlanilha` com as vagas `filtrosAvancados`, `acoes` e `acaoPrincipal`                  |
| Lista sem cartão, ponta a ponta; avatar alinhando a linha de baixo  | `Planilha` + `Avatar` (`data-avatar`)                                                           |
| Ações da linha num "⋯" com ícone e nome                             | `AcoesDaLinha`                                                                                  |
| Grid sem colunas não estoura a tela                                 | regra `:where(main, main .grid)` em `styles/index.css`                                          |

```tsx
// Lista paginada: o tamanho vem do hook, a página da URL.
const tamanhoDaPagina = useTamanhoDaPagina(TAMANHO_DA_PAGINA) // 20 no computador, 5 no celular
const pagina = paginar(itens, filtros.pagina, useTamanhoDaPagina()) // 10 / 5

// A ação que é a razão da tela.
<AcaoFixa>
  <Button size="xs" onClick={abrir}>Novo aviso</Button>
</AcaoFixa>
```

- **Na barra de filtros, diga o que cada botão é**, e não onde ele fica: o `BotaoDeFiltros` vai em
  `filtrosAvancados`, a ação que é a razão da tela em `acaoPrincipal` (vira `AcaoFixa` no celular) e
  o resto — ir a outra tela, exportar — em `acoes` (à vista também no celular: é o que não se acha de
  outro jeito). As pílulas vão todas para o painel; com ação, só a situação atual fica fora, na mesma
  linha do botão. Sem ação, ficam a primeira e a ligada. Nenhum painel preso a
  botão leva `grid`/`flex` na raiz: vence o `display: none` do popover fechado.
- **CSS primeiro.** `max-lg:`/`lg:` resolvem quase tudo. `useTelaGrande()` só quando a largura muda
  **dado** (tamanho da página) ou **quantas cópias** de uma peça existem (a busca tem id fixo) — ou para
  mudar a apresentação de uma peça (um guia vira `details`). A evolução do Início tem gráfico no
  computador e uma tabela mensal expansível no celular.
- **Na linha de tabela, a primeira célula nomeia e a última é a ação** (ou o selo). É isso que a lista
  do celular põe na primeira linha; o resto desce.
- **Confira em 360px** que não há rolagem lateral: `scrollWidth - clientWidth` do documento tem de dar 0.

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
