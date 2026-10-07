import { useId, useState } from 'react'
import { GraficoVazio } from '@/components/GraficoVazio'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { useArrecadacao } from '@/hooks/useArrecadacao'
import { useTelaGrande } from '@/hooks/useTelaGrande'
import {
  formatarCentavos,
  formatarMesDoDia,
  formatarMesLongo,
  formatarMoedaCurta,
  primeiraMaiuscula,
} from '@/lib/formato'
import { cn } from '@/lib/utils'

/** Três degraus acima do zero, como o modelo: R$ 0, 50 mil, 100 mil, 150 mil. */
const DEGRAUS = 3

/** A caixa do desenho, em unidades do `viewBox` — a área útil vai de (X0,Y0) a (X1,Y1). */
const LARGURA = 1000
const ALTURA = 235
const X0 = 90
const X1 = 950
const Y0 = 15
const Y1 = 175
const MESES_ROTULADOS_NO_CELULAR = 6

/** O degrau "redondo" que cobre o valor: 1, 2 ou 5 vezes uma potência de dez. */
function degrauRedondo(valor: number) {
  if (valor <= 0) return 1
  const potencia = 10 ** Math.floor(Math.log10(valor))
  const base = [1, 2, 5, 10].find((passo) => passo * potencia >= valor) ?? 10

  return base * potencia
}

/**
 * Quanto a turma já juntou, mês a mês — cada ponto é o acumulado ao fim do mês, ligados por uma linha
 * sobre uma área preenchida.
 *
 * Uma série só, então sem legenda: o título a nomeia. O mês atual vem com o ponto cheio e a dica
 * aberta, porque é a pergunta de quem abre o Início ("quanto temos hoje?"); passar o mouse escolhe o mês
 * da dica, e ela fica nele até outro passar. O próximo mês é previsão — o que já entrou mais o que vence
 * nele — e a dica diz isso.
 *
 * O desenho é um SVG só: a linha, a área, os pontos e os eixos saem das mesmas coordenadas. A tabela
 * escondida é a mesma informação para o leitor de tela.
 */
export function GraficoDaArrecadacao() {
  const telaGrande = useTelaGrande()
  const arrecadacao = useArrecadacao()
  const meses = arrecadacao.data ?? []
  const atual = meses.findLastIndex((mes) => !mes.projetado)
  const [apontado, definirApontado] = useState<number | null>(null)
  const ativo = apontado ?? atual
  const gradiente = useId().replace(/:/g, '')
  const larguraSvg = telaGrande ? LARGURA : 390
  const alturaSvg = telaGrande ? ALTURA : 275
  const xInicio = telaGrande ? X0 : 76
  const xFim = telaGrande ? X1 : 378
  const yInicio = telaGrande ? Y0 : 20
  const yFim = telaGrande ? Y1 : 190
  const yMeses = telaGrande ? 205 : 230

  const maior = Math.max(0, ...meses.map((mes) => mes.arrecadado_em_centavos))
  const degrau = degrauRedondo(maior / DEGRAUS)
  const teto = degrau * DEGRAUS

  const n = meses.length
  const passo = n > 1 ? (xFim - xInicio) / (n - 1) : 0
  const px = (indice: number) => xInicio + indice * passo
  const py = (valor: number) => yFim - (teto > 0 ? Math.min(valor / teto, 1) * (yFim - yInicio) : 0)
  const intervaloDosMeses = Math.max(1, Math.ceil(n / MESES_ROTULADOS_NO_CELULAR))

  const pontos = meses.map((mes, indice) => ({ x: px(indice), y: py(mes.arrecadado_em_centavos) }))
  const coordenadas = pontos.map((ponto) => `${ponto.x.toFixed(1)},${ponto.y.toFixed(1)}`)
  const linha = coordenadas.map((par, indice) => `${indice === 0 ? 'M' : 'L'}${par}`).join(' ')
  const area =
    pontos.length > 0
      ? `M${pontos[0]!.x.toFixed(1)},${yFim} ${coordenadas.map((par) => `L${par}`).join(' ')} L${pontos[pontos.length - 1]!.x.toFixed(1)},${yFim} Z`
      : ''

  return (
    <section aria-labelledby="bloco-evolucao" className="pt-6 pb-5 lg:pt-8">
      <h2 id="bloco-evolucao" className="text-[17px] font-semibold">
        Evolução das arrecadações
      </h2>

      {arrecadacao.isPending ? (
        <div className="mt-4">
          <EsqueletoDeTexto linhas={4} />
        </div>
      ) : null}
      {arrecadacao.isError ? (
        <div className="mt-4">
          <ErroDaConsulta
            compacto
            erro={arrecadacao.error}
            aoTentarDeNovo={() => void arrecadacao.refetch()}
          />
        </div>
      ) : null}

      {arrecadacao.data && maior === 0 ? (
        <GraficoVazio className="mt-4">
          Nenhum pagamento entrou ainda. Quando a turma começar a pagar, a evolução aparece aqui.
        </GraficoVazio>
      ) : null}

      {arrecadacao.data && maior > 0 ? (
        <>
          <div className="relative mt-4" aria-hidden>
            <svg viewBox={`0 0 ${larguraSvg} ${alturaSvg}`} className="h-auto w-full">
              <defs>
                <linearGradient id={gradiente} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--brand)" stopOpacity={0.33} />
                  <stop offset="1" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
              </defs>

              {Array.from({ length: DEGRAUS + 1 }, (_, indice) => {
                const y = yInicio + (indice / DEGRAUS) * (yFim - yInicio)

                return (
                  <g key={indice}>
                    <line
                      x1={xInicio - 10}
                      y1={y}
                      x2={xFim + 10}
                      y2={y}
                      className="stroke-border"
                      strokeDasharray="5 6"
                    />
                    <text
                      x={xInicio - 14}
                      y={y + 4}
                      textAnchor="end"
                      className={cn('fill-texto-muted', telaGrande ? 'text-[11px]' : 'text-[12px]')}
                    >
                      {indice === DEGRAUS ? 'R$ 0' : formatarMoedaCurta((DEGRAUS - indice) * degrau)}
                    </text>
                  </g>
                )
              })}

              <path d={area} fill={`url(#${gradiente})`} />
              <path
                d={linha}
                fill="none"
                className="stroke-brand"
                strokeWidth={3.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {ativo >= 0 && pontos[ativo] ? (
                <line
                  x1={pontos[ativo].x}
                  y1={pontos[ativo].y}
                  x2={pontos[ativo].x}
                  y2={yFim}
                  className="stroke-brand"
                  strokeWidth={1.8}
                  strokeDasharray="4 5"
                  opacity={0.65}
                />
              ) : null}

              {pontos.map((ponto, indice) => (
                <circle
                  key={meses[indice]!.mes}
                  cx={ponto.x}
                  cy={ponto.y}
                  r={indice === ativo ? 7.5 : 4.5}
                  className={cn('fill-brand', indice === ativo && 'stroke-card')}
                  strokeWidth={indice === ativo ? 3 : 0}
                />
              ))}

              {/* Alvos de ponteiro, maiores que os pontos: a dica acompanha o mês sob o mouse e fica
                  nele — sair não devolve ao mês atual, que é só o ponto de partida. */}
              {pontos.map((ponto, indice) => (
                <circle
                  key={`alvo-${meses[indice]!.mes}`}
                  cx={ponto.x}
                  cy={ponto.y}
                  r={18}
                  fill="transparent"
                  onMouseEnter={() => definirApontado(indice)}
                  onPointerDown={() => definirApontado(indice)}
                />
              ))}

              {meses.map((mes, indice) =>
                telaGrande || indice % intervaloDosMeses === 0 || indice === n - 1 ? (
                  <text
                    key={`mes-${mes.mes}`}
                    x={px(indice)}
                    y={yMeses}
                    textAnchor="middle"
                    className={cn(
                      telaGrande ? 'text-[11.5px]' : 'text-[12px]',
                      indice === ativo ? 'fill-foreground font-semibold' : 'fill-texto-muted',
                    )}
                  >
                    {primeiraMaiuscula(formatarMesDoDia(mes.mes))}
                  </text>
                ) : null,
              )}
            </svg>

            {ativo >= 0 && meses[ativo] ? (
              <span
                className="bg-card border-border shadow-cartao absolute -translate-x-1/2 rounded-xl border px-3 py-1.5 text-center whitespace-nowrap"
                style={{
                  left: `${
                    telaGrande
                      ? (px(ativo) / larguraSvg) * 100
                      : Math.max(25, Math.min((px(ativo) / larguraSvg) * 100, 75))
                  }%`,
                  bottom: `calc(${((alturaSvg - py(meses[ativo].arrecadado_em_centavos)) / alturaSvg) * 100}% + 16px)`,
                }}
              >
                <span className="text-muted-foreground block text-[11.5px]">
                  {primeiraMaiuscula(formatarMesLongo(meses[ativo].mes).split(' de ')[0] ?? '')}
                  {meses[ativo].projetado ? ' · previsto' : null}
                </span>
                <span className="block text-[15px] font-extrabold tabular-nums">
                  {formatarCentavos(meses[ativo].arrecadado_em_centavos)}
                </span>
              </span>
            ) : null}
          </div>

          <div className="sr-only">
            <table>
              <caption>Total arrecadado ao fim de cada mês</caption>
              <thead>
                <tr>
                  <th scope="col">Mês</th>
                  <th scope="col">Arrecadado</th>
                </tr>
              </thead>
              <tbody>
                {meses.map((mes) => (
                  <tr key={mes.mes}>
                    <th scope="row">
                      {formatarMesLongo(mes.mes)}
                      {mes.projetado ? ' (previsto)' : ''}
                    </th>
                    <td>{formatarCentavos(mes.arrecadado_em_centavos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  )
}
