import { AcoesDaLinha } from '@/components/AcoesDaLinha'
import { formatarCentavos, formatarData, formatarDataHora } from '@/lib/formato'
import type { Informe } from '../../types/pagamentos.types'
import { Comprovante } from './Comprovante'
import { Formando } from './Formando'

/** O que a tesouraria já fechou hoje. Sem o que marcar: já está baixado. */
export function LinhaDeConfirmado({ informe }: { informe: Informe }) {
  return (
    <tr className="border-b last:border-0">
      <Formando parcela={informe.parcela} />
      <td className="py-3 pr-4 whitespace-nowrap">{formatarData(informe.pago_em)}</td>
      <td className="text-success-text py-3 pr-4 text-right font-medium whitespace-nowrap">
        {formatarCentavos(informe.valor_em_centavos)}
      </td>
      <td className="py-3 pr-4 whitespace-nowrap">
        {informe.conferido_em ? formatarDataHora(informe.conferido_em) : '—'}
      </td>
      <td className="py-3 text-right">
        <AcoesDaLinha rotulo={`Ações do confirmado de ${informe.parcela.nome}`}>
          <Comprovante informe={informe} />
        </AcoesDaLinha>
      </td>
    </tr>
  )
}
