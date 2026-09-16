import { CalendarClock, CircleCheck, Hourglass, Wallet } from 'lucide-react'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import type { Extrato } from '../types/pagamentos.types'

/**
 * O topo do extrato, na faixa de números das demais telas: quanto falta, quando é a próxima, quanto
 * já foi pago e o que a tesouraria ainda não conferiu.
 *
 * O "Pagar" não mora mais aqui: a próxima parcela é a única linha da lista com o botão em destaque,
 * e um CTA só na tela evita o mesmo pedido em dois lugares.
 *
 * @param extrato Ausente enquanto carrega: os esqueletos da faixa guardam a altura.
 */
export function ResumoDoExtrato({ extrato }: { extrato: Extrato | undefined }) {
  const parcelas = extrato?.parcelas ?? []
  const pagas = parcelas.filter((p) => p.status === 'Paga').length
  const devidas = parcelas.filter((p) => p.status !== 'Cancelada').length
  const em_conferencia = parcelas.filter((p) => p.em_conferencia).length
  const proxima = extrato?.proxima

  return (
    <FaixaDeIndicadores
      rotulo="Resumo do extrato"
      indicadores={[
        {
          rotulo: 'Em aberto',
          valor: extrato ? formatarCentavos(extrato.em_aberto_em_centavos) : null,
          icone: Wallet,
        },
        {
          rotulo: 'Próxima parcela',
          // O dinheiro é o número grande, como nos vizinhos, e o vencimento é a unidade dele: assim
          // a quebra de linha da coluna estreita cai entre "R$ 400,00" e "em 30/11/2026".
          valor: !extrato
            ? null
            : proxima
              ? formatarCentavos(
                  proxima.valor_do_dia?.total_em_centavos ?? proxima.valor_original_em_centavos,
                )
              : 'Nada a pagar',
          // A data embaixo, e não ao lado: na coluna estreita o "em" sobrava sozinho no fim da linha.
          nota: proxima ? `vence em ${formatarData(proxima.vencimento)}` : undefined,
          // A situação da próxima, no lugar do chip que ficava ao lado do valor: só a vencida pede ação.
          sinal: proxima?.status === 'Vencida' ? { texto: 'vencida', tom: 'negativo' } : undefined,
          icone: CalendarClock,
        },
        {
          rotulo: 'Pagas',
          valor: extrato ? pagas : null,
          unidade: extrato ? `de ${formatarNumero(devidas)}` : undefined,
          icone: CircleCheck,
        },
        {
          rotulo: 'Em conferência',
          valor: extrato ? em_conferencia : null,
          icone: Hourglass,
        },
      ]}
    />
  )
}
