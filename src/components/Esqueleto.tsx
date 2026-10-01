import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Um bloco cinza no lugar de um pedaço de conteúdo que ainda não chegou.
 *
 * É a peça solta: altura, largura e arredondamento vêm de quem monta a forma. O tom é `bg-muted`
 * (`--track`), o mesmo cinza que separa superfícies no resto do app — esqueleto é ausência de
 * conteúdo, não um estado próprio, e não ganha cor nova na paleta.
 *
 * O pulso é o `animate-pulse` do Tailwind, atrás de `motion-safe` como todo movimento do app.
 *
 * Fica escondido do leitor de tela: quem anuncia o carregamento é a forma que hospeda o bloco —
 * um "Carregando…" por bloco de tela, e não um por retângulo.
 *
 * @param style Só para medida que não cabe em classe — a altura de cada coluna do gráfico.
 */
export function Esqueleto({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn('bg-muted rounded-lg motion-safe:animate-pulse', className)}
      style={style}
      aria-hidden
    />
  )
}

/**
 * A casca de toda forma de esqueleto: agrupa os blocos e diz, uma vez só, que aquele pedaço da
 * tela ainda está chegando.
 *
 * `<output>` em vez de `<div role="status">`: é a mesma região para o leitor de tela, com a tag que
 * o navegador já conhece. `aria-busy` marca a espera; o `sr-only` é o que de fato se ouve, porque
 * região sem texto não anuncia nada.
 */
function Aguardando({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <output aria-busy="true" className={className}>
      <span className="sr-only">Carregando…</span>
      {children}
    </output>
  )
}

/**
 * As larguras de uma linha de texto falsa, em ciclo. Fixas, e não sorteadas: com `Math.random` o
 * desenho mudaria a cada renderização, e o que é um lugar guardado viraria movimento. Variar as
 * larguras é o que faz o bloco ser lido como parágrafo, e não como uma pilha de barras iguais.
 */
const LARGURAS_DO_TEXTO = ['w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-5/6', 'w-full', 'w-3/4']

/**
 * Algumas linhas de texto: o parágrafo, a lista curta, o bloco que ainda não tem forma própria.
 *
 * As linhas têm larguras diferentes e a última sai mais curta — é o que faz o desenho ser lido
 * como texto, e não como tabela. Cada linha tem a altura de uma linha de corpo (18px), para o
 * espaço reservado chegar perto do que vai aparecer.
 *
 * @param linhas Quantas linhas desenhar.
 */
export function EsqueletoDeTexto({ linhas = 3, className }: { linhas?: number; className?: string }) {
  return (
    <Aguardando className={cn('grid gap-2.5', className)}>
      {Array.from({ length: linhas }, (_, indice) => (
        <Esqueleto
          key={indice}
          className={cn(
            'h-[18px]',
            linhas === 1
              ? 'w-1/2'
              : indice === linhas - 1
                ? 'w-2/3'
                : LARGURAS_DO_TEXTO[indice % LARGURAS_DO_TEXTO.length],
          )}
        />
      ))}
    </Aguardando>
  )
}

/**
 * Os pares rótulo/valor de um cadastro, na grade do `ListaDeDados`: ícone, rótulo e valor, com o
 * traço embaixo de cada linha.
 *
 * @param linhas Quantos pares desenhar — o cadastro que vem costuma ter entre quatro e seis.
 */
export function EsqueletoDeDados({ linhas = 4, className }: { linhas?: number; className?: string }) {
  return (
    <Aguardando className={cn('grid gap-3', className)}>
      {Array.from({ length: linhas }, (_, indice) => (
        <div
          key={indice}
          className="border-border grid grid-cols-[1.25rem_minmax(7rem,11rem)_minmax(0,1fr)] items-center gap-x-6 border-b pb-3 last:border-0 last:pb-0"
        >
          <Esqueleto className="size-4 rounded-md" />
          <Esqueleto className="h-4 w-28 max-w-full" />
          <Esqueleto className="h-4 w-full max-w-64" />
        </div>
      ))}
    </Aguardando>
  )
}

/**
 * Uma tabela: a linha do cabeçalho e as linhas da lista, todas na mesma grade de colunas.
 *
 * As linhas têm a altura das linhas de verdade (o respiro do `py-3` mais o texto) e o mesmo traço
 * entre elas, para o lugar reservado não ser um amontoado de barras rentes. A largura de cada
 * célula varia — nome cheio na primeira, valores curtos depois —, e a última coluna é um selo, que
 * é o que costuma fechá-las.
 *
 * O número de blocos é exatamente o da grade: o cabeçalho e uma célula por coluna em cada linha.
 * Há teste para isso.
 *
 * @param linhas Quantas linhas de dado — o tamanho da página costuma ser maior, mas a tela não
 *   precisa fingir a lista inteira para dizer "é uma tabela".
 * @param colunas Quantas colunas tem o cabeçalho da lista.
 */
export function EsqueletoDeTabela({
  linhas = 5,
  colunas = 4,
  className,
}: {
  linhas?: number
  colunas?: number
  className?: string
}) {
  const grade = { gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }

  return (
    <Aguardando className={cn('grid', className)}>
      <div className="border-border grid items-center gap-4 border-b pb-3" style={grade}>
        {Array.from({ length: colunas }, (_, coluna) => (
          <Esqueleto key={coluna} className="h-3.5 w-16 max-w-full" />
        ))}
      </div>

      {Array.from({ length: linhas }, (_vazio, linha) => (
        <div
          key={linha}
          className="border-border grid items-center gap-4 border-b py-3.5 last:border-0"
          style={grade}
        >
          {Array.from({ length: colunas }, (_celula, coluna) => (
            <Esqueleto
              key={coluna}
              className={cn(
                'h-4',
                coluna === 0 ? 'w-4/5' : coluna === colunas - 1 ? 'h-6 w-16 rounded-full' : 'w-2/3',
              )}
            />
          ))}
        </div>
      ))}
    </Aguardando>
  )
}

/**
 * O cartão branco inteiro antes de ter conteúdo: o bloco do ícone, o título, a descrição e o
 * corpo. A superfície é a do `Cartao` — mesma sombra, mesmo raio, mesmo respiro.
 *
 * Para a tela cujo título só se sabe depois da resposta (o nome do fornecedor, a descrição da
 * despesa). Onde o título é fixo, use o `Cartao` de verdade com um esqueleto dentro: o cabeçalho
 * já pode ser lido enquanto o resto chega.
 *
 * @param children O corpo; sem ele, algumas linhas de texto.
 */
export function EsqueletoDeCartao({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={cn('bg-card shadow-cartao grid content-start gap-5 rounded-3xl p-5', className)}>
      <div className="flex items-start gap-3">
        <Esqueleto className="size-11 shrink-0 rounded-xl" />
        <div className="grid flex-1 gap-2">
          <Esqueleto className="h-5 w-48 max-w-full" />
          <Esqueleto className="h-3.5 w-72 max-w-full" />
        </div>
      </div>

      {children ?? <EsqueletoDeTexto linhas={4} />}
    </div>
  )
}

/**
 * Uma fileira de cartões fechados: os planos, as formaturas da seleção, o quadro de documentos.
 *
 * Cada cartão carrega a forma do que vai chegar — ícone, título, corpo e um pé com o que se faz
 * nele —, para a tela não nascer vazia e depois pular. A altura vem de fora porque muda por tela;
 * o que não couber é recortado, então um lugar mais baixo mostra o começo do cartão, e não um
 * cartão de outro tamanho.
 *
 * @param quantidade Quantos cartões — o mesmo número que a tela costuma trazer.
 * @param altura A altura de cada um, em classe (`h-52`), porque ela varia por tela.
 * @param forma `cartao` para a grade de cartões; `linha` para a lista de opções finas (uma linha
 *   alta, com título, descrição e selo), como a escolha de formatura.
 */
export function EsqueletoDeCartoes({
  quantidade = 3,
  altura = 'h-52',
  forma = 'cartao',
  className,
}: {
  quantidade?: number
  altura?: string
  forma?: 'cartao' | 'linha'
  className?: string
}) {
  return (
    <Aguardando className={cn('grid gap-4 md:grid-cols-3', className)}>
      {Array.from({ length: quantidade }, (_, indice) =>
        forma === 'linha' ? (
          <div
            key={indice}
            className={cn('bg-card shadow-cartao flex items-center gap-4 rounded-2xl px-4', altura)}
          >
            <div className="grid flex-1 gap-2">
              <Esqueleto className="h-4 w-44 max-w-full" />
              <Esqueleto className="h-3 w-64 max-w-full" />
            </div>
            <Esqueleto className="h-6 w-16 shrink-0 rounded-md" />
          </div>
        ) : (
          <div
            key={indice}
            className={cn(
              'bg-card shadow-cartao flex flex-col gap-4 overflow-hidden rounded-3xl p-5',
              altura,
            )}
          >
            <div className="flex items-start gap-3">
              <Esqueleto className="size-11 shrink-0 rounded-xl" />
              <div className="grid flex-1 gap-2">
                <Esqueleto className="h-5 w-40 max-w-full" />
                <Esqueleto className="h-3.5 w-56 max-w-full" />
              </div>
            </div>
            <div className="grid content-start gap-2.5">
              <Esqueleto className="h-[18px] w-full" />
              <Esqueleto className="h-[18px] w-11/12" />
              <Esqueleto className="h-[18px] w-2/3" />
            </div>
            {/* O pé desce para a base do cartão: o lugar reservado tem a altura do que vem, e não
                um bloco de texto boiando no topo de um vazio. */}
            <div className="mt-auto flex gap-2">
              <Esqueleto className="h-9 w-28 rounded-lg" />
              <Esqueleto className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        ),
      )}
    </Aguardando>
  )
}

/**
 * O lugar de um quadro em colunas — a agenda por mês: cada coluna cinza com o título, a contagem e
 * os cartões de evento dentro. A forma segue a do quadro de verdade para a tela não trocar de
 * desenho quando os dados chegam.
 *
 * @param colunas Quantas colunas — a agenda mostra quatro no computador.
 * @param cartoes Quantos cartões por coluna.
 */
export function EsqueletoDeQuadro({
  colunas = 4,
  cartoes = 3,
  className,
}: {
  colunas?: number
  cartoes?: number
  className?: string
}) {
  return (
    <Aguardando className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-4', className)}>
      {Array.from({ length: colunas }, (_vazio, coluna) => (
        <section key={coluna} className="bg-muted grid min-w-0 content-start gap-3 rounded-3xl p-3">
          <div className="flex items-center gap-2 px-1 pt-0.5">
            <Esqueleto className="h-4 w-24 max-w-full" />
            <Esqueleto className="ml-auto h-4 w-14 shrink-0" />
          </div>
          <div className="grid gap-3">
            {Array.from({ length: cartoes }, (_cartao, cartao) => (
              <div key={cartao} className="bg-card shadow-cartao grid gap-2 rounded-2xl p-3.5">
                <div className="flex items-center gap-2">
                  <Esqueleto className="h-4 flex-1" />
                  <Esqueleto className="size-5 shrink-0 rounded-full" />
                </div>
                <Esqueleto className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </Aguardando>
  )
}

/**
 * As alturas das colunas, em porcentagem. Fixas, e não sorteadas: com `Math.random` o desenho
 * mudaria a cada renderização, e o que deveria ser um lugar guardado viraria movimento.
 */
const BARRAS = [48, 72, 56, 88, 62, 78, 44, 68, 82, 54]

/**
 * O lugar de um gráfico enquanto ele não chega, nas duas formas que o app desenha: as colunas do
 * `GraficoDeCaixa` (240px de altura, as mesmas dele) e a rosca com a legenda ao lado.
 *
 * @param forma `barras` para o gráfico de entradas e saídas; `rosca` para as de categoria e
 *   fornecedor, e para o medidor de adimplência.
 */
export function EsqueletoDeGrafico({
  forma = 'barras',
  className,
}: {
  forma?: 'barras' | 'rosca'
  className?: string
}) {
  if (forma === 'rosca')
    return (
      <Aguardando className={cn('flex h-full flex-wrap items-center justify-center gap-6', className)}>
        <Esqueleto className="size-44 shrink-0 rounded-full" />
        <div className="grid min-w-52 flex-1 gap-3">
          <Esqueleto className="h-4 w-full" />
          <Esqueleto className="h-4 w-5/6" />
          <Esqueleto className="h-4 w-11/12" />
          <Esqueleto className="h-4 w-2/3" />
        </div>
      </Aguardando>
    )

  return (
    <Aguardando className={cn('grid gap-4', className)}>
      <div className="flex gap-3">
        <Esqueleto className="h-3.5 w-24" />
        <Esqueleto className="h-3.5 w-20" />
      </div>
      <div className="flex h-[240px] items-end gap-2">
        {BARRAS.map((altura, indice) => (
          <Esqueleto key={indice} className="min-w-0 flex-1" style={{ height: `${altura}%` }} />
        ))}
      </div>
    </Aguardando>
  )
}
