import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import { CaixaRolavel } from '@/components/CaixaRolavel'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { Tabela } from '@/components/Planilha'
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
  if (erro) {
    return <ErroDaConsulta erro={erro} />
  }

  if (!simulacao || simulacao.parcelas.length === 0) {
    return (
      <div className="grid justify-items-center gap-2 py-6 text-center">
        <img src={mascoteCofrinho} alt="" className="w-24 drop-shadow-lg" />
        <p className="text-foreground font-medium">A grade aparece aqui</p>
        <p className="text-muted-foreground text-sm">
          Inclua uma cobrança para ver as parcelas de cada formando.
        </p>
      </div>
    )
  }

  const variosItens = new Set(simulacao.parcelas.map(rotuloDoItem)).size > 1

  return (
    <div className={cn('grid gap-4', atualizando && 'opacity-60')} aria-busy={atualizando}>
      {/* A mesma caixa da grade da adesão, que é onde o formando lê exatamente esta lista. */}
      <CaixaRolavel altura="max-h-[26rem]">
        <Tabela
          variante="faixa"
          grudado
          legenda="Parcelas de um formando"
          cabecalho={
            <>
              <th>Parcela</th>
              <th>Vencimento</th>
              <th className="text-right">Valor</th>
            </>
          }
          rodape={
            <>
              <td className="text-foreground px-3 pt-3 font-medium">Total</td>
              <td className="text-muted-foreground px-3 pt-3 whitespace-nowrap">
                {formatarNumero(simulacao.parcelas.length)} parcelas
              </td>
              <td className="text-foreground px-3 pt-3 text-right font-medium whitespace-nowrap tabular-nums">
                {formatarCentavos(simulacao.total_por_formando)}
              </td>
            </>
          }
        >
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
        </Tabela>
      </CaixaRolavel>
    </div>
  )
}
