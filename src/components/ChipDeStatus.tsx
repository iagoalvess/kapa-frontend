import type { ComponentProps } from 'react'
import { Selo } from '@/components/Selo'
import type { StatusDaParcela } from '@/types/cobranca'

const APARENCIA: Record<StatusDaParcela, { rotulo: string; tom: ComponentProps<typeof Selo>['tom'] }> = {
  Aberta: { rotulo: 'Aberta', tom: 'cinza' },
  Paga: { rotulo: 'Paga', tom: 'sucesso' },
  Vencida: { rotulo: 'Vencida', tom: 'perigo' },
  Renegociada: { rotulo: 'Renegociada', tom: 'alerta' },
  Cancelada: { rotulo: 'Cancelada', tom: 'neutro' },
}

/**
 * A situação de uma parcela, na cor de sempre: aberta cinza, paga verde, vencida vermelha.
 *
 * Com aviso de pagamento pendente, lê-se "Em conferência", em amarelo — é leitura, não status: a
 * parcela continua aberta até a tesouraria achar o dinheiro (Sprint 9). Mora em `components/` porque
 * a lista da gestão e o extrato do formando usam o mesmo chip.
 *
 * @param em_conferencia O formando avisou que pagou; só vale para a parcela em aberto.
 */
export function ChipDeStatus({
  status,
  em_conferencia = false,
}: {
  status: StatusDaParcela
  em_conferencia?: boolean
}) {
  if (em_conferencia && (status === 'Aberta' || status === 'Vencida'))
    return <Selo tom="alerta">Em conferência</Selo>

  const { rotulo, tom } = APARENCIA[status]

  return <Selo tom={tom}>{rotulo}</Selo>
}

/** Rótulos dos status, para os filtros. */
export const ROTULOS_DE_STATUS = Object.fromEntries(
  Object.entries(APARENCIA).map(([status, { rotulo }]) => [status, rotulo]),
) as Record<StatusDaParcela, string>
