import { CalendarClock, Hash, TriangleAlert, Wallet } from 'lucide-react'
import { CABECALHO_GRUDADO, CaixaRolavel } from '@/components/CaixaRolavel'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { formatarCentavos, formatarData, formatarNumero, formatarPercentual } from '@/lib/formato'
import { Tabela } from '@/components/Planilha'
import { rotuloDoItem } from '@/types/cobranca'
import type { ItemAceito, PlanoAceito } from '../types/adesoes.types'

/** As regras de atraso numa frase — a mesma ideia do texto que vai no PDF e no e-mail. */
export function regrasDeAtraso(plano: PlanoAceito) {
  const atraso =
    plano.percentual_de_multa === 0 && plano.percentual_de_juros_ao_mes === 0
      ? 'Sem multa nem juros em caso de atraso.'
      : `Em caso de atraso: multa de ${formatarPercentual(plano.percentual_de_multa)} e juros de ${formatarPercentual(plano.percentual_de_juros_ao_mes)} ao mês${
          plano.carencia_em_dias > 0
            ? `, depois de ${formatarNumero(plano.carencia_em_dias)} dias de carência`
            : ''
        }.`

  const antecedencia =
    plano.dias_minimos_para_desconto > 0
      ? `com pelo menos ${formatarNumero(plano.dias_minimos_para_desconto)} ${plano.dias_minimos_para_desconto === 1 ? 'dia' : 'dias'} de antecedência`
      : 'antes do vencimento'

  return plano.percentual_de_desconto_por_antecipacao > 0
    ? `${atraso} Desconto de ${formatarPercentual(plano.percentual_de_desconto_por_antecipacao)} para pagamento ${antecedencia}.`
    : atraso
}

/**
 * Os quatro números do plano no topo da tela, na faixa do modelo: total, parcelas, a primeira e o
 * atraso. É o "o que você vai pagar" — vem antes do termo de propósito: termo de seis páginas
 * antes do número é como se esconde o número.
 */
export function IndicadoresDoPlano({ plano, rotulo }: { plano: PlanoAceito; rotulo: string }) {
  const primeira = plano.parcelas[0]

  return (
    <FaixaDeIndicadores
      rotulo={rotulo}
      indicadores={[
        { rotulo: 'Total a pagar', valor: formatarCentavos(plano.total_em_centavos), icone: Wallet },
        { rotulo: 'Parcelas', valor: plano.parcelas.length, icone: Hash },
        {
          rotulo: primeira ? `Primeira parcela · ${formatarData(primeira.vencimento)}` : 'Primeira parcela',
          valor: primeira ? formatarCentavos(primeira.valor_em_centavos) : null,
          icone: CalendarClock,
        },
        {
          rotulo: 'Multa + juros mensais',
          valor:
            plano.percentual_de_multa === 0 && plano.percentual_de_juros_ao_mes === 0
              ? 'Sem'
              : `${formatarPercentual(plano.percentual_de_multa)} + ${formatarPercentual(plano.percentual_de_juros_ao_mes)}`,
          icone: TriangleAlert,
        },
      ]}
    />
  )
}

/** A primeira parcela do item, como a API a calculou — nenhuma conta de vencimento aqui. */
const primeiraDoItem = (plano: PlanoAceito, item: ItemAceito) =>
  plano.parcelas.find((parcela) => parcela.numero === 1 && rotuloDoItem(parcela) === rotuloDoItem(item))

/**
 * O plano em tabela, sem letra miúda: cada item com total, parcelas, primeiro vencimento e dia; as
 * regras de atraso numa frase; e a grade inteira, parcela por parcela, a um clique.
 *
 * `<details>` nativo para a grade: 24 linhas abertas empurrariam o aceite para longe, e o teclado e
 * o leitor de tela já sabem abrir.
 */
export function ResumoFinanceiroDaAdesao({ plano }: { plano: PlanoAceito }) {
  return (
    <div className="grid gap-4">
      <Tabela
        variante="faixa"
        legenda="Itens do plano"
        cabecalho={
          <>
            <th>Item</th>
            <th className="text-right">Parcelas</th>
            <th className="text-right">Total</th>
          </>
        }
        rodape={
          <>
            <td className="text-foreground px-3 pt-3 font-medium">Total</td>
            <td className="text-muted-foreground px-3 pt-3 text-right whitespace-nowrap">
              {formatarNumero(plano.parcelas.length)} parcelas
            </td>
            <td className="text-foreground px-3 pt-3 text-right font-medium whitespace-nowrap tabular-nums">
              {formatarCentavos(plano.total_em_centavos)}
            </td>
          </>
        }
      >
        {plano.itens.map((item) => {
          const primeira = primeiraDoItem(plano, item)

          return (
            <tr key={`${item.tipo}-${rotuloDoItem(item)}`} className="border-b last:border-0">
              {/* Três colunas: a tabela mora na coluna estreita, e o vencimento cabe como detalhe do item. */}
              <td className="px-3 py-2.5">
                <span className="text-foreground block font-medium">{rotuloDoItem(item)}</span>
                <span className="text-muted-foreground text-xs">
                  1ª em {formatarData(primeira?.vencimento)} · todo dia {item.dia_de_vencimento}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right whitespace-nowrap">
                {formatarNumero(item.numero_de_parcelas)}×
              </td>
              <td className="px-3 py-2.5 text-right whitespace-nowrap">
                {formatarCentavos(item.valor_em_centavos)}
              </td>
            </tr>
          )
        })}
      </Tabela>

      <p className="bg-muted/60 text-foreground rounded-xl px-4 py-3 text-sm">{regrasDeAtraso(plano)}</p>

      <details className="group rounded-xl border px-4 py-3">
        <summary className="text-foreground cursor-pointer text-sm font-medium">
          Ver as {formatarNumero(plano.parcelas.length)} parcelas
        </summary>
        <CaixaRolavel className="mt-3">
          <table className="w-full text-sm">
            <caption className="sr-only">Parcelas, por vencimento</caption>
            <thead className="text-texto-muted sticky top-0 text-left text-xs">
              <tr>
                <th className={`${CABECALHO_GRUDADO} pr-3 font-normal`}>Parcela</th>
                <th className={`${CABECALHO_GRUDADO} pr-3 font-normal`}>Vencimento</th>
                <th className={`${CABECALHO_GRUDADO} text-right font-normal`}>Valor</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {plano.parcelas.map((parcela) => (
                <tr key={`${rotuloDoItem(parcela)}-${parcela.numero}`} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    {parcela.numero}/{parcela.de}
                    {plano.itens.length > 1 ? (
                      <span className="text-muted-foreground"> · {rotuloDoItem(parcela)}</span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3">{formatarData(parcela.vencimento)}</td>
                  <td className="py-2 text-right">{formatarCentavos(parcela.valor_em_centavos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CaixaRolavel>
      </details>
    </div>
  )
}
