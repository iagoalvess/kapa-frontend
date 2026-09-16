import type { LucideIcon } from 'lucide-react'
import { useId } from 'react'
import { Esqueleto } from '@/components/Esqueleto'
import { formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'

export interface Indicador {
  rotulo: string
  /** Número vai com separador de milhar; texto ("Ativa") vai como está. Nulo enquanto carrega: um esqueleto guarda a altura. */
  valor: number | string | null
  /** Unidade depois do número, em cinza ("membros", "de 203"). */
  unidade?: string
  icone: LucideIcon
  /**
   * Selo embaixo do número, como o "On target" / "breach" da referência: verde quando está bem,
   * vermelho quando pede ação. Ausente, não há o que sinalizar.
   */
  sinal?: { texto: string; tom: 'positivo' | 'negativo' }
  /** Uma linha miúda embaixo do valor, para dizer contra o que o selo compara ("vs. período anterior"). */
  nota?: string
  /**
   * A série do minigráfico, na ordem do tempo — o traçado do modelo embaixo de cada número.
   *
   * É só a forma: sem eixo, sem rótulo e sem valor. Quem precisa dos números os lê no quadro
   * detalhado da mesma tela, e é por isso que ele é `aria-hidden` inteiro.
   */
  serie?: number[]
}

const TONS_DO_SINAL = {
  positivo: 'bg-sinal-positivo-bg text-sinal-positivo-text',
  negativo: 'bg-sinal-negativo-bg text-sinal-negativo-text',
} as const

/**
 * Texto longo sem ponto de quebra — dinheiro: `R$ 1.370.250,00` — encolhe até caber na célula, em
 * vez de vazar dela. O tamanho sai da largura da coluna (`cqi`), com teto no tamanho de sempre: o
 * que já cabe continua igual. Número curto ("82") nem entra na conta.
 */
function tamanhoDoValor(valor: Indicador['valor']) {
  // 7 caracteres: `R$ 300,00` já não cabe na meia-tela do celular, e sem encolher ele sai da borda.
  if (typeof valor !== 'string' || valor.length <= 7) return 'text-[1.75rem]'
  return valor.length <= 12 ? 'text-[length:min(1.75rem,15cqi)]' : 'text-[length:min(1.75rem,11cqi)]'
}

/** Geometria do minigráfico, em unidades do `viewBox`. */
const MINI = { largura: 120, altura: 26, respiro: 3 }

/**
 * O traçado do modelo embaixo do número: a série normalizada entre o menor e o maior valor dela,
 * com o degradê da própria cor da linha esmaecendo até o chão — a "sombra" dos cartões do modelo.
 *
 * Reta ligando ponto a ponto, sem curva: em 26 pixels de altura o arredondamento não se vê, e a
 * curva ultrapassaria os pontos inventando um valor. Série de um ponto só vira uma linha reta no
 * meio — é o que ela é.
 *
 * O degradê usa `currentColor`, e não o token direto: linha e preenchimento são a mesma cor por
 * construção, e trocar a cor do traço leva a sombra junto.
 *
 * @param serie Valores na ordem do tempo.
 */
function Minigrafico({ serie }: { serie: number[] }) {
  // `useId` porque a faixa desenha quatro destes: id repetido faz todos apontarem para o primeiro.
  const degrade = `minigrafico-${useId()}`
  const menor = Math.min(...serie)
  const maior = Math.max(...serie)
  const faixa = maior - menor
  const passo = MINI.largura / Math.max(serie.length - 1, 1)
  const util = MINI.altura - MINI.respiro * 2

  const pontos = serie.map((valor, indice) => {
    const y = faixa === 0 ? MINI.altura / 2 : MINI.respiro + util - ((valor - menor) / faixa) * util

    return `${indice * passo},${y}`
  })

  const traco = pontos.join(' ')

  return (
    <svg
      viewBox={`0 0 ${MINI.largura} ${MINI.altura}`}
      preserveAspectRatio="none"
      className="text-brand h-6 w-full justify-self-stretch"
      aria-hidden
    >
      <defs>
        <linearGradient id={degrade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* A mesma linha fechada no chão, para o degradê ter o que preencher. */}
      <polygon
        points={`${traco} ${MINI.largura},${MINI.altura} 0,${MINI.altura}`}
        fill={`url(#${degrade})`}
      />
      <polyline
        points={traco}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * Faixa branca de números do topo da tela: ícone num bloco cinza, rótulo, o valor grande e, quando
 * houver, o sinal verde ou vermelho, a nota da comparação e o minigráfico embaixo.
 *
 * Os números ficam lado a lado, separados por um traço vertical, e viram duas colunas no celular.
 *
 * @param indicadores Os números, na ordem de leitura.
 * @param rotulo Nome da faixa para o leitor de tela ("Resumo dos membros").
 */
export function FaixaDeIndicadores({ indicadores, rotulo }: { indicadores: Indicador[]; rotulo: string }) {
  return (
    // Altura da faixa: o `py-*` daqui (24px). A referência respira mais que um cartão comum.
    <section
      aria-label={rotulo}
      className="bg-card shadow-faixa grid grid-cols-2 gap-y-5 rounded-3xl px-5 py-7 lg:grid-cols-4"
    >
      {indicadores.map(({ rotulo: nome, valor, unidade, icone: Icone, sinal, nota, serie }, indice) => (
        <dl key={nome} className={cn('flex items-center gap-3 px-2', indice > 0 && 'lg:border-l lg:pl-6')}>
          <span className="bloco-de-icone text-card inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Icone className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="@container grid min-w-0 flex-1 gap-1">
            <dt className="text-muted-foreground text-sm leading-snug">{nome}</dt>
            {/* O selo sempre embaixo do número: ao lado, ele subia com "negativo" e descia com
                "R$ 11.249,98 em atraso", e dois indicadores vizinhos não se alinhavam. */}
            <dd className="grid justify-items-start gap-1.5" aria-busy={valor === null}>
              {/* Nulo é "a consulta não voltou" (contrato do `valor`): no lugar do número vai um
                  esqueleto da altura dele, para a faixa não encolher quando o dado chegar. */}
              {valor === null ? (
                <>
                  <span className="sr-only">Carregando…</span>
                  <Esqueleto className="my-1.5 h-6 w-28 max-w-full" />
                </>
              ) : (
                <span
                  className={cn(
                    'text-foreground leading-tight font-medium tracking-tight',
                    tamanhoDoValor(valor),
                  )}
                >
                  {typeof valor === 'string' ? valor : formatarNumero(valor)}
                  {unidade ? (
                    <span className="text-muted-foreground ml-1 text-base font-normal">{unidade}</span>
                  ) : null}
                </span>
              )}
              {sinal ? (
                <span
                  className={cn('rounded-md px-1.5 py-0.5 text-[13px] font-medium', TONS_DO_SINAL[sinal.tom])}
                >
                  {sinal.texto}
                </span>
              ) : null}
              {nota ? <span className="text-texto-muted text-xs">{nota}</span> : null}
              {serie && serie.length > 0 ? <Minigrafico serie={serie} /> : null}
            </dd>
          </div>
        </dl>
      ))}
    </section>
  )
}
