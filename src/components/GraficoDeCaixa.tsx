import { formatarCentavos, formatarMesAno, formatarMesCurto } from '@/lib/formato'

/**
 * Um mês do fluxo, como a API o devolve.
 *
 * Declarado aqui, e não importado do financeiro: `components/` não importa de `features/`, e o
 * `MesDoCaixa` da API satisfaz esta forma por estrutura — quem passa a lista não converte nada.
 */
export interface MesDoGrafico {
  /** Primeiro dia do mês, em ISO. */
  mes: string
  /** Mês no futuro: a curva vai tracejada daqui para a frente. */
  projetado: boolean
  entradas_em_centavos: number
  entradas_previstas_em_centavos: number
  saidas_em_centavos: number
  saidas_previstas_em_centavos: number
  /** Saldo ao fim do mês, somando realizado e previsto — a coluna de fecho da tabela alternativa. */
  saldo_acumulado_em_centavos: number
}

/** Geometria do desenho, em unidades do `viewBox`. */
const ALTURA = 190
const LARGURA = 760
/** Sobra à esquerda para os rótulos do eixo (`R$ 12 mil`). */
const EIXO = 52
/** Topo do desenho: onde fica a linha de grade do valor máximo. */
const TOPO = 16
/** As cinco linhas de grade, do chão ao teto da escala. */
const GRADE = [0, 0.25, 0.5, 0.75, 1]
/** A caixinha que aparece ao passar o mouse num mês. */
const DICA = { largura: 138, altura: 54 }

interface Ponto {
  x: number
  y: number
}

/** Reais inteiros, curto, para o eixo: `R$ 12 mil`, `R$ 1,2 mi`. */
function escalaCurta(centavos: number) {
  const reais = Math.abs(centavos) / 100
  if (reais >= 1_000_000) return `R$ ${(reais / 1_000_000).toFixed(1).replace('.', ',')} mi`
  if (reais >= 1_000) return `R$ ${Math.round(reais / 1_000)} mil`

  return formatarCentavos(centavos)
}

/**
 * A curva que passa por todos os pontos, arredondada nos cantos (Catmull-Rom em Bézier).
 *
 * Reta ligando ponto a ponto vira um serrote com dois anos de meses; a curva é o que o modelo
 * desenha. O sexto da distância é a tensão padrão da conversão — mais que isso, a curva ultrapassa
 * os pontos e inventa um valor que não existe.
 */
function curva(pontos: Ponto[]) {
  const primeiro = pontos[0]
  if (!primeiro) return ''

  return pontos.slice(0, -1).reduce((caminho, ponto, indice) => {
    const anterior = pontos[indice - 1] ?? ponto
    const proximo = pontos[indice + 1]
    if (!proximo) return caminho
    const seguinte = pontos[indice + 2] ?? proximo

    const c1 = { x: ponto.x + (proximo.x - anterior.x) / 6, y: ponto.y + (proximo.y - anterior.y) / 6 }
    const c2 = { x: proximo.x - (seguinte.x - ponto.x) / 6, y: proximo.y - (seguinte.y - ponto.y) / 6 }

    return `${caminho} C${c1.x},${c1.y} ${c2.x},${c2.y} ${proximo.x},${proximo.y}`
  }, `M${primeiro.x},${primeiro.y}`)
}

/** A mesma curva fechada no chão, para o degradê por baixo dela. */
function areaSob(pontos: Ponto[]) {
  const primeiro = pontos[0]
  const ultimo = pontos.at(-1)
  if (!primeiro || !ultimo || pontos.length < 2) return ''

  return `${curva(pontos)} L${ultimo.x},${ALTURA} L${primeiro.x},${ALTURA} Z`
}

/**
 * Entradas × saídas, mês a mês, em duas curvas com degradê — o desenho do gráfico de fluxo do
 * modelo de dashboard.
 *
 * Duas séries de polaridade oposta, no par verde/vermelho já validado para daltonismo: a legenda e
 * a posição carregam a identidade junto com a cor, que sozinha nunca é a única pista.
 *
 * O **trecho projetado** não é uma cor a mais: é a mesma curva em tracejado e sem preenchimento, a
 * partir de uma linha vertical no último mês fechado. Projeção que parece dado realizado é como uma
 * comissão contrata o que não pode pagar.
 *
 * SVG à mão, sem biblioteca de gráfico: são duas curvas e uma grade, e a alternativa custaria uns
 * 200 KB no pacote. Os pontos e a caixinha do mês aparecem no hover, por CSS (`group-hover`), sem
 * estado nem posicionamento em JS — em repouso ficam só as duas linhas, como no modelo.
 */
export function GraficoDeCaixa({ meses }: { meses: MesDoGrafico[] }) {
  const linhas = meses.map((mes) => ({
    mes: mes.mes,
    projetado: mes.projetado,
    entrada: mes.entradas_em_centavos + mes.entradas_previstas_em_centavos,
    saida: mes.saidas_em_centavos + mes.saidas_previstas_em_centavos,
  }))

  // Teto real, sem piso artificial: com `Math.max(..., 1)`, a turma sem movimento ganhava um eixo
  // de "R$ 0,01" repetido cinco vezes — um número que não existe. A divisão por zero é tratada
  // em `alturaDe`, que é o único lugar onde ela apareceria.
  const teto = Math.max(...linhas.flatMap((linha) => [linha.entrada, linha.saida]), 0)
  const passo = (LARGURA - EIXO) / Math.max(linhas.length - 1, 1)
  const alturaDe = (valor: number) => (teto === 0 ? ALTURA : ALTURA - (valor / teto) * (ALTURA - TOPO))
  const x = (indice: number) => EIXO + indice * passo

  const serie = (chave: 'entrada' | 'saida') =>
    linhas.map((linha, indice) => ({ x: x(indice), y: alturaDe(linha[chave]) }))

  // O tracejado começa no último mês fechado, senão a curva nasceria solta no ar.
  const corte = linhas.findIndex((linha) => linha.projetado)
  const fatiar = (pontos: Ponto[]) => ({
    realizado: corte === -1 ? pontos : pontos.slice(0, corte),
    projetado: corte === -1 ? [] : pontos.slice(Math.max(corte - 1, 0)),
  })

  const series = [
    { chave: 'entrada' as const, cor: 'var(--success-fill)', degrade: 'degrade-entrada' },
    { chave: 'saida' as const, cor: 'var(--danger-fill)', degrade: 'degrade-saida' },
  ]

  // Com dois anos de projeção, um rótulo por mês vira uma tarja preta.
  const passoDoRotulo = Math.ceil(linhas.length / 8)
  const inicioDaProjecao = corte > 0 ? x(corte - 1) : null
  // Série só de meses fechados — o período de um relatório — não fala de projeção: a legenda e a
  // frase do leitor de tela sumiriam prometendo um tracejado que não existe no desenho.
  const temProjecao = corte !== -1

  return (
    <figure className="grid gap-4">
      <figcaption className="flex flex-wrap items-center gap-4 text-sm">
        <Legenda cor="var(--success-fill)" rotulo="Entradas" />
        <Legenda cor="var(--danger-fill)" rotulo="Saídas" />
        {temProjecao ? (
          <span className="text-muted-foreground inline-flex items-center gap-2">
            <svg width="18" height="8" aria-hidden className="shrink-0">
              <line
                x1="0"
                y1="4"
                x2="18"
                y2="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
            </svg>
            Projeção
          </span>
        ) : null}
      </figcaption>

      {/* O desenho é redundante de propósito: quem usa leitor de tela lê esta frase e a tabela
          logo abaixo, com os mesmos valores, mês a mês. */}
      <p className="sr-only">
        Entradas e saídas do caixa, mês a mês, de {formatarMesAno(linhas[0]?.mes)} a{' '}
        {formatarMesAno(linhas.at(-1)?.mes)}.{temProjecao ? ' Os meses futuros são projeção.' : ''} Os valores
        estão na tabela abaixo do gráfico.
      </p>

      {/* O `sr-only` vai na `div`, não na `table`: `overflow: hidden` não recorta uma caixa de
          tabela, e a tabela — larga por causa dos valores — empurrava a largura do documento,
          criando rolagem horizontal no celular sem nada visível para explicá-la. */}
      <div className="sr-only">
        <table>
          <caption>Entradas, saídas e saldo acumulado do caixa, mês a mês</caption>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Entradas</th>
              <th>Saídas</th>
              <th>Saldo acumulado</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((mes) => (
              <tr key={mes.mes}>
                <td>
                  {formatarMesAno(mes.mes)}
                  {mes.projetado ? ' · projeção' : ''}
                </td>
                <td>{formatarCentavos(mes.entradas_em_centavos + mes.entradas_previstas_em_centavos)}</td>
                <td>{formatarCentavos(mes.saidas_em_centavos + mes.saidas_previstas_em_centavos)}</td>
                <td>{formatarCentavos(mes.saldo_acumulado_em_centavos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <svg viewBox={`0 0 ${LARGURA} ${ALTURA + 26}`} className="h-[240px] w-full" aria-hidden>
        <defs>
          {series.map(({ cor, degrade }) => (
            <linearGradient key={degrade} id={degrade} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={cor} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {GRADE.map((fracao) => {
          const y = ALTURA - fracao * (ALTURA - TOPO)

          return (
            <g key={fracao}>
              <line x1={EIXO} y1={y} x2={LARGURA} y2={y} stroke="var(--line)" strokeWidth="1" />
              <text x={EIXO - 10} y={y + 3} textAnchor="end" fontSize="10" fill="var(--text-muted)">
                {escalaCurta(teto * fracao)}
              </text>
            </g>
          )
        })}

        {/* Onde o dado acaba e a projeção começa. */}
        {inicioDaProjecao ? (
          <line
            x1={inicioDaProjecao}
            y1={TOPO}
            x2={inicioDaProjecao}
            y2={ALTURA}
            stroke="var(--line)"
            strokeWidth="1"
          />
        ) : null}

        {series.map(({ chave, cor, degrade }) => {
          const { realizado, projetado } = fatiar(serie(chave))

          return (
            <g key={chave}>
              <path d={areaSob(realizado)} fill={`url(#${degrade})`} />
              <path
                d={curva(realizado)}
                fill="none"
                stroke={cor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={curva(projetado)}
                fill="none"
                stroke={cor}
                strokeWidth="2"
                strokeDasharray="5 4"
                strokeLinecap="round"
              />
            </g>
          )
        })}

        {linhas.map((linha, indice) => {
          const centro = x(indice)
          const yEntrada = alturaDe(linha.entrada)
          const ySaida = alturaDe(linha.saida)

          // A caixinha abre acima do ponto mais alto e não passa das bordas do desenho.
          const xDica = Math.min(Math.max(centro - DICA.largura / 2, EIXO), LARGURA - DICA.largura)
          const yDica = Math.max(Math.min(yEntrada, ySaida) - DICA.altura - 12, 0)

          return (
            <g key={linha.mes} className="group">
              <title>
                {formatarMesAno(linha.mes)}
                {linha.projetado ? ' (projeção)' : ''}: entradas {formatarCentavos(linha.entrada)}, saídas{' '}
                {formatarCentavos(linha.saida)}
              </title>

              {indice % passoDoRotulo === 0 ? (
                <text
                  x={centro}
                  y={ALTURA + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--text-muted)"
                  fontStyle={linha.projetado ? 'italic' : undefined}
                >
                  {formatarMesCurto(linha.mes)}
                </text>
              ) : null}

              {/* Área de captura do mês inteiro: o mouse não precisa acertar a curva. */}
              <rect x={centro - passo / 2} y={0} width={passo} height={ALTURA} fill="transparent" />

              {/* Em repouso o gráfico é só as duas linhas; o ponto e a caixinha são do mês sob o mouse. */}
              <g className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100">
                <line
                  x1={centro}
                  y1={TOPO}
                  x2={centro}
                  y2={ALTURA}
                  stroke="var(--text-muted)"
                  strokeDasharray="3 3"
                />
                <circle cx={centro} cy={yEntrada} r="4" fill="var(--success-fill)" />
                <circle cx={centro} cy={ySaida} r="4" fill="var(--danger-fill)" />

                <g className="drop-shadow-sm">
                  <rect
                    x={xDica}
                    y={yDica}
                    width={DICA.largura}
                    height={DICA.altura}
                    rx="10"
                    fill="var(--surface)"
                    stroke="var(--line)"
                  />
                  <text x={xDica + 12} y={yDica + 18} fontSize="10" fill="var(--text-muted)">
                    {formatarMesAno(linha.mes)}
                    {linha.projetado ? ' · projeção' : ''}
                  </text>
                  <text x={xDica + 12} y={yDica + 34} fontSize="11" fill="var(--success-text)">
                    ↑ {formatarCentavos(linha.entrada)}
                  </text>
                  <text x={xDica + 12} y={yDica + 48} fontSize="11" fill="var(--danger-text)">
                    ↓ {formatarCentavos(linha.saida)}
                  </text>
                </g>
              </g>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}

function Legenda({ cor, rotulo }: { cor: string; rotulo: string }) {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-2">
      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} aria-hidden />
      {rotulo}
    </span>
  )
}
