import { formatarCentavos } from '@/lib/formato'

/** Geometria da rosca, em unidades do `viewBox`. */
const RAIO = 50
const CENTRO = 70
const GROSSURA = 24
/** O respiro entre uma fatia e a seguinte, no comprimento do arco. */
const VAO = 2.5

/**
 * As fatias, em tons claros de mesma força (`--grafico-*`, em `styles/index.css`): o tamanho do
 * arco diz a grandeza, a cor só separa uma fatia da outra. "Outras" fica no cinza, fora da escala.
 */
const CORES = [
  'var(--grafico-1)',
  'var(--grafico-2)',
  'var(--grafico-3)',
  'var(--grafico-4)',
  'var(--grafico-5)',
]
const COR_DE_OUTRAS = 'var(--grafico-outras)'

/** Quantas fatias próprias antes de o resto virar "Outras", como o "Other" do modelo. */
const FATIAS = CORES.length

/** Uma fatia, já reduzida a nome e valor por quem chama. */
export interface Fatia {
  /** Chave estável da fatia — a categoria, o id do fornecedor. */
  chave: string
  /** O nome que aparece na legenda. */
  rotulo: string
  /** Quanto, em centavos. */
  valor: number
}

/** Reais inteiros, curto, para o meio da rosca: `R$ 54,8 mil`. */
function escalaCurta(centavos: number) {
  const reais = centavos / 100
  if (reais >= 1_000_000) return `R$ ${(reais / 1_000_000).toFixed(1).replace('.', ',')} mi`
  if (reais >= 1_000) return `R$ ${(reais / 1_000).toFixed(1).replace('.', ',')} mil`

  return formatarCentavos(centavos)
}

/**
 * A rosca do modelo de relatórios: a fatia de cada item, o total no meio e a legenda com valor e
 * porcentagem.
 *
 * Genérica de propósito — recebe `{ chave, rotulo, valor }` e não sabe se está desenhando categoria
 * de despesa ou fornecedor. As duas telas que a usam (Caixa e Relatórios) reduzem os próprios dados
 * a essa forma antes de chamar.
 *
 * SVG à mão, como o gráfico de linhas: são seis arcos, e uma biblioteca de gráfico custaria uns
 * 200 KB no pacote.
 *
 * @param fatias Já ordenadas, da maior para a menor — a rosca não reordena.
 * @param rotuloDoTotal A palavra embaixo do número do meio ("total", "pago").
 */
export function GraficoDeRosca({
  fatias: recebidas,
  rotuloDoTotal = 'total',
}: {
  fatias: Fatia[]
  rotuloDoTotal?: string
}) {
  // Fatia que não vale nada não é fatia: o fornecedor contratado e ainda não pago apareceria como
  // "R$ 0,00 · 0%" na legenda de uma rosca que só mostra o que já saiu.
  const itens = recebidas.filter((item) => item.valor > 0)
  const soma = itens.reduce((acumulado, item) => acumulado + item.valor, 0)

  const principais = itens.slice(0, FATIAS).map((item, indice) => ({ ...item, cor: CORES[indice] as string }))
  const resto = itens.slice(FATIAS)

  const fatias = resto.length
    ? [
        ...principais,
        {
          chave: 'outras',
          rotulo: `Outras (${resto.length})`,
          valor: resto.reduce((acumulado, item) => acumulado + item.valor, 0),
          cor: COR_DE_OUTRAS,
        },
      ]
    : principais

  const volta = 2 * Math.PI * RAIO

  // O arco de cada fatia começa onde o anterior parou: a volta é a soma, e o traço é a fatia.
  const arcos = fatias.map((fatia, indice) => {
    const parte = soma > 0 ? fatia.valor / soma : 0
    const antes =
      soma > 0 ? fatias.slice(0, indice).reduce((acumulado, f) => acumulado + f.valor, 0) / soma : 0

    return {
      ...fatia,
      // O vão sai do fim do arco: fatia menor que ele sumiria, então nunca passa da metade dela.
      traco: Math.max(parte * volta - VAO, parte * volta * 0.5),
      inicio: -antes * volta,
    }
  })

  return (
    // Rosca à esquerda, legenda à direita, o conjunto centrado na altura: o cartão acompanha o
    // gráfico ao lado, e a sobra se divide entre cima e embaixo em vez de virar um vão no pé.
    <div className="motion-safe:animate-entrar flex h-full flex-wrap items-center justify-center gap-6">
      <svg viewBox={`0 0 ${CENTRO * 2} ${CENTRO * 2}`} className="size-44 shrink-0" aria-hidden>
        {arcos.map((arco) => (
          <circle
            key={arco.chave}
            cx={CENTRO}
            cy={CENTRO}
            r={RAIO}
            fill="none"
            stroke={arco.cor}
            strokeWidth={GROSSURA}
            strokeDasharray={`${arco.traco} ${volta}`}
            strokeDashoffset={arco.inicio}
            transform={`rotate(-90 ${CENTRO} ${CENTRO})`}
          />
        ))}
        <text
          x={CENTRO}
          y={CENTRO - 1}
          textAnchor="middle"
          fontSize="13"
          fontWeight="500"
          fill="var(--text-primary)"
        >
          {escalaCurta(soma)}
        </text>
        <text x={CENTRO} y={CENTRO + 13} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
          {rotuloDoTotal}
        </text>
      </svg>

      <dl className="grid min-w-52 flex-1 gap-3 text-sm">
        {fatias.map((fatia) => (
          <div key={fatia.chave} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: fatia.cor }}
              aria-hidden
            />
            <dt className="text-foreground min-w-0 flex-1 truncate">{fatia.rotulo}</dt>
            <dd className="text-foreground shrink-0 tabular-nums">{formatarCentavos(fatia.valor)}</dd>
            <span className="text-muted-foreground w-9 shrink-0 text-right tabular-nums">
              {soma > 0 ? Math.round((fatia.valor / soma) * 100) : 0}%
            </span>
          </div>
        ))}
      </dl>
    </div>
  )
}
