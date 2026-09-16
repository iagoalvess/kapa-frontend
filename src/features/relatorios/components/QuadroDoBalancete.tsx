import type { LucideIcon } from 'lucide-react'
import { Cartao } from '@/components/Cartao'
import { Tabela } from '@/components/Planilha'
import { formatarCentavos } from '@/lib/formato'
import type { LinhaDeBalancete } from '../types/relatorios.types'

/**
 * Um quadro do balancete: as linhas agrupadas, a fatia de cada uma e o total no pé.
 *
 * A barra atrás do rótulo é a mesma informação do percentual, em comprimento — quem lê a tabela de
 * relance vê o tamanho antes de ler o número. Não é cor codificando nada: é uma só, e a grandeza
 * está no tamanho.
 *
 * @param linhas Já ordenadas pela API, da maior para a menor.
 * @param rotuloDaColuna O que a primeira coluna nomeia ("Categoria", "Fornecedor").
 */
export function QuadroDoBalancete({
  titulo,
  icone,
  descricao,
  rotuloDaColuna,
  linhas,
  className,
}: {
  titulo: string
  icone: LucideIcon
  descricao: string
  rotuloDaColuna: string
  linhas: LinhaDeBalancete[]
  className?: string
}) {
  const total = linhas.reduce((soma, linha) => soma + linha.valor_em_centavos, 0)

  return (
    <Cartao titulo={titulo} icone={icone} descricao={descricao} className={className}>
      {linhas.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum lançamento no período escolhido.</p>
      ) : (
        <Tabela
          cabecalho={
            <>
              <th className="py-2 pr-3 font-normal">{rotuloDaColuna}</th>
              <th className="py-2 pr-3 text-right font-normal">Lanç.</th>
              <th className="py-2 pr-3 text-right font-normal">Valor</th>
              <th className="w-24 py-2 text-right font-normal">%</th>
            </>
          }
        >
          {linhas.map((linha) => {
            const fatia = total > 0 ? (linha.valor_em_centavos / total) * 100 : 0

            return (
              <tr key={linha.rotulo} className="border-border border-b last:border-0">
                <td className="text-foreground py-3 pr-3 font-sans">{linha.rotulo}</td>
                <td className="text-muted-foreground py-3 pr-3 text-right">{linha.quantidade}</td>
                <td className="text-foreground py-3 pr-3 text-right font-medium">
                  {formatarCentavos(linha.valor_em_centavos)}
                </td>
                {/* A barra é só desenho (`aria-hidden`); o número ao lado é a informação, e é ele
                    que o leitor de tela lê. Cor nenhuma codifica nada aqui: a grandeza é o tamanho. */}
                <td className="text-muted-foreground flex items-center justify-end gap-2 py-3">
                  <span className="bg-border h-1.5 w-12 overflow-hidden rounded-full" aria-hidden>
                    <span className="bg-brand block h-full rounded-full" style={{ width: `${fatia}%` }} />
                  </span>
                  {Math.round(fatia)}%
                </td>
              </tr>
            )
          })}
          {/* `colSpan`: a linha de total não repete a contagem de lançamentos — a soma delas não
              significa nada, e a célula vazia no meio deixava a tabela com um buraco. */}
          <tr className="border-border border-t-2">
            <td colSpan={2} className="text-foreground py-3 pr-3 font-medium">
              Total
            </td>
            <td className="text-foreground py-3 pr-3 text-right font-medium">{formatarCentavos(total)}</td>
            <td className="text-muted-foreground py-3 text-right">100%</td>
          </tr>
        </Tabela>
      )}
    </Cartao>
  )
}
