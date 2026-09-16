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
 * Algumas linhas de texto: o parágrafo, a lista curta, o bloco que ainda não tem forma própria.
 *
 * A última linha sai mais curta — é o que faz o desenho ser lido como texto, e não como tabela.
 *
 * @param linhas Quantas linhas desenhar.
 */
export function EsqueletoDeTexto({ linhas = 3, className }: { linhas?: number; className?: string }) {
  return (
    <Aguardando className={cn('grid gap-2.5', className)}>
      {Array.from({ length: linhas }, (_, indice) => (
        <Esqueleto key={indice} className={cn('h-4', linhas > 1 && indice === linhas - 1 && 'w-2/3')} />
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
          <Esqueleto className="h-4 w-24" />
          <Esqueleto className="h-4 w-full max-w-64" />
        </div>
      ))}
    </Aguardando>
  )
}

/**
 * Uma tabela: a linha do cabeçalho e as linhas da lista, todas na mesma grade de colunas.
 *
 * As colunas são iguais entre si de propósito — o esqueleto não sabe qual delas é a larga, e
 * chutar uma largura por coluna faria o cabeçalho pular quando os dados chegassem.
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
    <Aguardando className={cn('grid gap-4 py-2', className)}>
      <div className="border-border grid gap-4 border-b pb-3" style={grade}>
        {Array.from({ length: colunas }, (_, coluna) => (
          <Esqueleto key={coluna} className="h-3 w-16 max-w-full" />
        ))}
      </div>

      {Array.from({ length: linhas }, (_vazio, linha) => (
        <div key={linha} className="grid items-center gap-4" style={grade}>
          {Array.from({ length: colunas }, (_celula, coluna) => (
            <Esqueleto key={coluna} className={cn('h-4', coluna === 0 ? 'w-full' : 'w-2/3')} />
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
 * @param children O corpo; sem ele, três linhas de texto.
 */
export function EsqueletoDeCartao({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={cn('bg-card shadow-cartao grid content-start gap-5 rounded-3xl p-5', className)}>
      <div className="flex items-start gap-3">
        <Esqueleto className="size-10 shrink-0 rounded-xl" />
        <div className="grid flex-1 gap-2">
          <Esqueleto className="h-5 w-48 max-w-full" />
          <Esqueleto className="h-3.5 w-72 max-w-full" />
        </div>
      </div>

      {children ?? <EsqueletoDeTexto />}
    </div>
  )
}

/**
 * Uma fileira de cartões fechados: os planos, as formaturas da seleção, o quadro de documentos.
 *
 * @param quantidade Quantos cartões — o mesmo número que a tela costuma trazer.
 * @param altura A altura de cada um, em classe (`h-52`), porque ela varia por tela.
 */
export function EsqueletoDeCartoes({
  quantidade = 3,
  altura = 'h-52',
  className,
}: {
  quantidade?: number
  altura?: string
  className?: string
}) {
  return (
    <Aguardando className={cn('grid gap-4 md:grid-cols-3', className)}>
      {Array.from({ length: quantidade }, (_, indice) => (
        <Esqueleto key={indice} className={cn('rounded-3xl', altura)} />
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
          {Array.from({ length: 4 }, (_, indice) => (
            <Esqueleto key={indice} className="h-4" />
          ))}
        </div>
      </Aguardando>
    )

  return (
    <Aguardando className={cn('grid gap-4', className)}>
      <div className="flex gap-3">
        <Esqueleto className="h-3 w-24" />
        <Esqueleto className="h-3 w-20" />
      </div>
      <div className="flex h-[240px] items-end gap-2">
        {BARRAS.map((altura, indice) => (
          <Esqueleto key={indice} className="min-w-0 flex-1" style={{ height: `${altura}%` }} />
        ))}
      </div>
    </Aguardando>
  )
}
