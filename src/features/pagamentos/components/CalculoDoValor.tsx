import { formatarCentavos, formatarNumero } from '@/lib/formato'
import type { ValorDoDia } from '../types/pagamentos.types'

/**
 * A conta aberta do valor de hoje: original, multa, juros e desconto, linha por linha.
 *
 * Valor maior sem explicação é chamado no grupo da turma no mesmo minuto (Sprint 9) — por isso a conta
 * inteira, com os dias de atraso, e não só o total.
 */
export function CalculoDoValor({ valor }: { valor: ValorDoDia }) {
  const dias = `${formatarNumero(valor.dias_de_atraso)} ${valor.dias_de_atraso === 1 ? 'dia' : 'dias'}`
  const linhas: [string, number][] = [['Valor da parcela', valor.original_em_centavos]]

  if (valor.multa_em_centavos) linhas.push(['Multa por atraso', valor.multa_em_centavos])
  if (valor.juros_em_centavos) linhas.push([`Juros de ${dias}`, valor.juros_em_centavos])
  if (valor.desconto_em_centavos) linhas.push(['Desconto por pagar antes', -valor.desconto_em_centavos])

  return (
    <dl className="grid gap-1 text-sm tabular-nums">
      {linhas.map(([rotulo, centavos]) => (
        <div key={rotulo} className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{rotulo}</dt>
          <dd>{formatarCentavos(centavos)}</dd>
        </div>
      ))}
      <div className="text-foreground flex justify-between gap-4 border-t pt-1 font-medium">
        <dt>Total de hoje</dt>
        <dd>{formatarCentavos(valor.total_em_centavos)}</dd>
      </div>
    </dl>
  )
}

/** Se multa, juros ou desconto mudaram o valor — só aí vale abrir a conta. */
export const temEncargoOuDesconto = (valor: ValorDoDia | undefined): valor is ValorDoDia =>
  valor !== undefined && valor.total_em_centavos !== valor.original_em_centavos
