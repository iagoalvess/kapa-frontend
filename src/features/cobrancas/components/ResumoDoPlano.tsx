import { CalendarRange, Landmark, Users, Wallet } from 'lucide-react'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { formatarCentavos } from '@/lib/formato'
import type { SimulacaoDoPlano } from '../types/cobrancas.types'

interface Props {
  /** Simulação do plano **gravado** — não a do formulário em edição. */
  simulacao?: SimulacaoDoPlano
}

/**
 * Os números do plano gravado: quanto cada formando paga, em quantas parcelas, quantos são e o
 * total da turma — a faixa do topo, como nas telas do modelo.
 *
 * Sai da simulação do plano salvo, e não da prévia do formulário, que ainda pode ser descartada. A
 * situação do plano não entra aqui: ela está no cabeçalho, junto das ações que a mudam.
 */
export function ResumoDoPlano({ simulacao }: Props) {
  return (
    <FaixaDeIndicadores
      rotulo="Resumo do plano"
      indicadores={[
        {
          rotulo: 'Por formando',
          valor: simulacao ? formatarCentavos(simulacao.total_por_formando) : null,
          icone: Wallet,
        },
        {
          rotulo: 'Parcelas por formando',
          valor: simulacao?.parcelas.length ?? null,
          icone: CalendarRange,
        },
        {
          rotulo: 'Na turma hoje',
          valor: simulacao?.formandos ?? null,
          icone: Users,
        },
        {
          rotulo: 'Total da turma',
          valor: simulacao ? formatarCentavos(simulacao.total_da_turma) : null,
          icone: Landmark,
        },
      ]}
    />
  )
}
