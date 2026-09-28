import { Selo } from '@/components/Selo'
import type { Pedido } from '../types/cobrancas.types'

/**
 * A situação que importa não é só "confirmado": é se o dinheiro entrou.
 *
 * Sem baixa automática, um pedido confirmado e não pago é exatamente o caso que a tesouraria
 * precisa ver para decidir cancelar e devolver a unidade ao estoque — e o que o formando precisa ver
 * para saber que ainda deve.
 */
export function SituacaoDoPedido({ pedido }: { pedido: Pedido }) {
  if (pedido.status === 'Cancelado') return <Selo>Cancelado</Selo>

  return pedido.quitado ? <Selo tom="sucesso">Pago</Selo> : <Selo tom="cinza">Aguardando pagamento</Selo>
}
