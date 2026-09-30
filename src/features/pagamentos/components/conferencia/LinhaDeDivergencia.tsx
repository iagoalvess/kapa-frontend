import { Selo } from '@/components/Selo'
import { formatarCentavos, formatarData } from '@/lib/formato'
import { ROTULOS_DE_FORMA } from '../../schemas/pagamento.schema'
import type { Divergencia } from '../../types/pagamentos.types'
import { Formando } from './Formando'

/** Uma baixa que não bateu com o devido. Registro: a diferença não vira saldo nem se resolve aqui. */
export function LinhaDeDivergencia({ divergencia }: { divergencia: Divergencia }) {
  const diferenca = divergencia.recebido_em_centavos - divergencia.devido_em_centavos

  return (
    <tr className="border-b last:border-0">
      <Formando parcela={divergencia.parcela} />
      <td className="py-3 pr-4 whitespace-nowrap">{formatarData(divergencia.pago_em)}</td>
      <td className="py-3 pr-4 text-right whitespace-nowrap">
        {formatarCentavos(divergencia.devido_em_centavos)}
      </td>
      <td className="py-3 pr-4 text-right whitespace-nowrap">
        {formatarCentavos(divergencia.recebido_em_centavos)}
      </td>
      <td className="py-3 pr-4">
        <Selo tom="alerta">
          {diferenca > 0 ? 'A mais' : 'A menos'} {formatarCentavos(Math.abs(diferenca))}
        </Selo>
      </td>
      <td className="text-texto-muted py-3">
        {ROTULOS_DE_FORMA[divergencia.forma]}
        <span className="block text-xs">{divergencia.baixado_por}</span>
      </td>
    </tr>
  )
}
