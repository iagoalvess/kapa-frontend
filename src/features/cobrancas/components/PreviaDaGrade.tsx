import { ChevronDown } from 'lucide-react'
import { useRef, useState } from 'react'
import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { rotuloDoItem, type SimulacaoDoPlano } from '../types/cobrancas.types'

interface Props {
  simulacao?: SimulacaoDoPlano
  /** Recalculando depois de uma mudança: a grade anterior fica, esmaecida. */
  atualizando: boolean
  erro: unknown
}

/**
 * A grade de um formando, como a API calculou: "1/24 · 10/03/2026 · R$ 350,00", e o total.
 *
 * O nome do item só aparece quando o plano tem mais de um — com um só, repeti-lo em 24 linhas é
 * ruído. Nenhuma conta é feita aqui: o que está na tela é o que o servidor vai gerar.
 */
export function PreviaDaGrade({ simulacao, atualizando, erro }: Props) {
  const lista = useRef<HTMLDivElement | null>(null)
  const [temMais, definirTemMais] = useState(false)

  /** A seta do pé só aparece enquanto sobra lista para rolar. */
  const conferirSeTemMais = () => {
    const caixa = lista.current
    if (caixa) definirTemMais(caixa.scrollHeight - caixa.scrollTop - caixa.clientHeight > 1)
  }

  /**
   * Mede assim que o nó entra, e não só ao rolar: aqui a grade já nasce à vista — diferente da
   * adesão, onde ela abre num `<details>` e a medição pega o `onToggle`.
   */
  const medir = (caixa: HTMLDivElement | null) => {
    lista.current = caixa
    conferirSeTemMais()
  }

  if (erro) {
    return <ErroDaConsulta erro={erro} />
  }

  if (!simulacao || simulacao.parcelas.length === 0) {
    return (
      <div className="grid justify-items-center gap-2 py-6 text-center">
        <img src={mascoteCofrinho} alt="" className="w-24 drop-shadow-lg" />
        <p className="text-foreground font-medium">A grade aparece aqui</p>
        <p className="text-muted-foreground text-sm">Inclua um item para ver as parcelas de cada formando.</p>
      </div>
    )
  }

  const variosItens = new Set(simulacao.parcelas.map(rotuloDoItem)).size > 1

  return (
    <div className={cn('grid gap-4', atualizando && 'opacity-60')} aria-busy={atualizando}>
      {/* A rolagem não mostra barra, e a seta no pé avisa que ainda há parcelas para baixo — o
          mesmo da grade da adesão, que é onde o formando lê exatamente esta lista. */}
      {/* `key` pelo número de parcelas: é o que muda a altura da lista, e remontar refaz a medida. */}
      <div
        key={simulacao.parcelas.length}
        ref={medir}
        onScroll={conferirSeTemMais}
        className="max-h-[26rem] [scrollbar-width:none] overflow-y-auto [&::-webkit-scrollbar]:hidden"
      >
        <table className="w-full text-sm">
          <caption className="sr-only">Parcelas de um formando</caption>
          <thead className="text-texto-muted bg-muted/60 sticky top-0 text-left text-xs">
            <tr>
              <th className="rounded-l-lg px-3 py-2 font-normal">Parcela</th>
              <th className="px-3 py-2 font-normal">Vencimento</th>
              <th className="rounded-r-lg px-3 py-2 text-right font-normal">Valor</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {simulacao.parcelas.map((parcela, indice) => (
              <tr key={indice} className="border-b last:border-0">
                <td className="px-3 py-2.5">
                  {parcela.numero}/{parcela.de}
                  {variosItens ? (
                    <span className="text-muted-foreground"> · {rotuloDoItem(parcela)}</span>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">{formatarData(parcela.vencimento)}</td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  {formatarCentavos(parcela.valor_em_centavos)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="text-foreground px-3 pt-3 font-medium">Total</td>
              <td className="text-muted-foreground px-3 pt-3 whitespace-nowrap">
                {formatarNumero(simulacao.parcelas.length)} parcelas
              </td>
              <td className="text-foreground px-3 pt-3 text-right font-medium whitespace-nowrap tabular-nums">
                {formatarCentavos(simulacao.total_por_formando)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Altura zero no fluxo (`-mt-10` desfaz o `h-10`): cobre a última linha visível sem mudar a rolagem. */}
        {temMais ? (
          <div
            aria-hidden
            className="from-card pointer-events-none sticky bottom-0 -mt-10 flex h-10 items-end justify-center bg-linear-to-t to-transparent"
          >
            <ChevronDown className="text-muted-foreground size-4" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
