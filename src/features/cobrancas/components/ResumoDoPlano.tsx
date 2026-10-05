import { Layers, Package, TicketCheck, Users } from 'lucide-react'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { formatarCentavos } from '@/lib/formato'
import type { PlanoDeCobranca } from '../types/cobrancas.types'

interface Props {
  plano: PlanoDeCobranca
  /** Membros ativos hoje, da simulação do plano gravado. */
  formandos?: number
}

/**
 * Os números do catálogo gravado: quantos pacotes, quantos grupos de faixas, do mais barato ao mais caro, e
 * quantos estão na turma.
 *
 * Desde a Sprint 47 não há "quanto cada formando paga": cada um deve a própria cesta, e somar o catálogo daria um
 * número que ninguém deve. A situação do plano não entra aqui: ela está no cabeçalho, junto das ações que a mudam.
 */
export function ResumoDoPlano({ plano, formandos }: Props) {
  const pacotes = plano.itens.filter((item) => item.pacote && !item.encerrado_em)
  const precos = pacotes.map((pacote) => pacote.valor_em_centavos)
  const grupos = new Set(pacotes.map((pacote) => pacote.grupo).filter(Boolean)).size

  return (
    <FaixaDeIndicadores
      rotulo="Resumo do catálogo"
      indicadores={[
        { rotulo: 'Pacotes à venda', valor: pacotes.length, icone: Package },
        { rotulo: 'Grupos de faixas', valor: grupos, icone: Layers },
        {
          rotulo: 'Do mais barato ao mais caro',
          valor:
            precos.length > 0
              ? `${formatarCentavos(Math.min(...precos))} – ${formatarCentavos(Math.max(...precos))}`
              : null,
          icone: TicketCheck,
        },
        { rotulo: 'Na turma hoje', valor: formandos ?? null, icone: Users },
      ]}
    />
  )
}
