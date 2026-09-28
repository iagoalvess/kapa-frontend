import { ChartColumnIncreasing } from 'lucide-react'
import { useState } from 'react'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { useArrecadacao } from '@/hooks/useArrecadacao'
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

/** O degrau "redondo" que cobre o valor: 1, 2 ou 5 vezes uma potência de dez. */
function degrauRedondo(valor: number) {
  if (valor <= 0) return 1
  const potencia = 10 ** Math.floor(Math.log10(valor))
  const base = [1, 2, 5, 10].find((passo) => passo * potencia >= valor) ?? 10

  return base * potencia
}

/**
 * Quanto a turma já juntou, mês a mês — cada barra é o acumulado ao fim do mês.
 *
 * Uma série só, então sem legenda: o título a nomeia. O mês atual vem cheio de laranja e com a
 * dica aberta, porque é a pergunta de quem abre o Início ("quanto temos hoje?"); passar o mouse
 * leva a dica a outro mês. O próximo mês é previsão — o que já entrou mais o que vence nele — e a
 * dica diz isso.
 *
 * Barras em HTML, e não SVG: a dica e a coluna destacada se posicionam pela altura em porcentagem,
 * sem geometria à mão. A tabela escondida é a mesma informação para o leitor de tela.
 */
export function GraficoDaArrecadacao() {
  const arrecadacao = useArrecadacao()
  const meses = arrecadacao.data ?? []
  const atual = meses.findLastIndex((mes) => !mes.projetado)
  const [apontado, definirApontado] = useState<number | null>(null)
  const ativo = apontado ?? atual

  const maior = Math.max(0, ...meses.map((mes) => mes.arrecadado_em_centavos))
  const degrau = degrauRedondo(maior / DEGRAUS)
  const teto = degrau * DEGRAUS

  return (
    <Cartao titulo="Evolução das arrecadações" icone={ChartColumnIncreasing} className="gap-4">
      {arrecadacao.isPending ? <EsqueletoDeTexto linhas={4} /> : null}
      {arrecadacao.isError ? <ErroDaConsulta erro={arrecadacao.error} /> : null}

      {arrecadacao.data && maior === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhum pagamento entrou ainda. Quando a turma começar a pagar, a evolução aparece aqui.
        </p>
      ) : null}

      {arrecadacao.data && maior > 0 ? (
        <>
          <div aria-hidden className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
            {/* O eixo: cada rótulo centrado na altura da sua linha de grade, do teto ao zero. */}
            <div className="text-texto-muted relative h-44 w-16 text-right text-xs tabular-nums">
              {Array.from({ length: DEGRAUS + 1 }, (_, indice) => (
                <span
                  key={indice}
                  className="absolute right-0 -translate-y-1/2 whitespace-nowrap"
                  style={{ top: `${(indice / DEGRAUS) * 100}%` }}
                >
                  {indice === DEGRAUS ? 'R$ 0' : formatarMoedaCurta((DEGRAUS - indice) * degrau)}
                </span>
              ))}
            </div>

            <div className="relative h-44">
              {Array.from({ length: DEGRAUS + 1 }, (_, indice) => (
                <span
                  key={indice}
                  className="border-border absolute inset-x-0 border-t border-dashed"
                  style={{ top: `${(indice / DEGRAUS) * 100}%` }}
                />
              ))}

              <div className="absolute inset-0 flex items-end">
                {meses.map((mes, indice) => {
                  const altura = (mes.arrecadado_em_centavos / teto) * 100
                  const destaque = indice === ativo

                  return (
                    <div
                      key={mes.mes}
                      className={cn(
                        'relative flex h-full flex-1 items-end justify-center rounded-t-xl transition-colors',
                        destaque && 'bg-brand-wash/70',
                      )}
                      onMouseEnter={() => definirApontado(indice)}
                      onMouseLeave={() => definirApontado(null)}
                    >
                      <span
                        className={cn(
                          'relative z-10 w-1/2 max-w-9',
                          destaque
                            ? 'bg-brand'
                            : mes.projetado
                              ? 'from-brand-tint/70 to-brand-wash bg-linear-to-t'
                              : 'from-brand-soft/70 to-brand-wash bg-linear-to-t',
                        )}
                        style={{ height: `${Math.max(altura, 2)}%` }}
                      />

                      {destaque ? (
                        <span
                          className="bg-card shadow-cartao after:bg-card absolute z-20 -translate-y-3.5 rounded-xl px-3 py-2 whitespace-nowrap after:absolute after:top-full after:left-1/2 after:size-3 after:-translate-x-1/2 after:-translate-y-1/2 after:rotate-45 after:rounded-[2px]"
                          style={{ bottom: `${altura}%` }}
                        >
                          <span className="text-muted-foreground block text-xs">
                            {primeiraMaiuscula(formatarMesLongo(mes.mes).split(' de ')[0] ?? '')}
                            {mes.projetado ? ' · previsto' : null}
                          </span>
                          <span className="block text-sm font-bold tabular-nums">
                            {formatarCentavos(mes.arrecadado_em_centavos)}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <span />
            <div className="mt-2 flex">
              {meses.map((mes, indice) => (
                <span
                  key={mes.mes}
                  className={cn(
                    'flex-1 text-center text-xs',
                    indice === ativo ? 'text-foreground font-semibold' : 'text-muted-foreground',
                  )}
                >
                  {primeiraMaiuscula(formatarMesDoDia(mes.mes))}
                </span>
              ))}
            </div>
          </div>

          <table className="sr-only">
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
        </>
      ) : null}
    </Cartao>
  )
}
