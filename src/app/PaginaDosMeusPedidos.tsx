import { Link, useNavigate } from 'react-router'
import { IconePix } from '@/components/IconePix'
import { Button } from '@/components/ui/button'
import { ROTAS, rotaDoPagamentoEmLote } from '@/config/rotas'
import type { Pedido } from '@/features/cobrancas'
import MeusPedidosPage from '@/features/cobrancas/pages/MeusPedidosPage'
import { useExtrato } from '@/features/pagamentos'
import { aPagar, type Parcela } from '@/types/cobranca'

/** As parcelas de um pedido que o PIX aceita hoje: as dele, em aberto, sem aviso na fila. */
const paraPagar = (parcelas: Parcela[] | undefined, pedido: Pedido) =>
  (parcelas ?? [])
    .filter((parcela) => parcela.item_de_cobranca_id === pedido.item_de_cobranca_id && aPagar(parcela))
    .map((parcela) => parcela.id)

/**
 * "Meus pedidos", com o caminho até o PIX.
 *
 * Mora em `app/` porque compõe duas features: os pedidos são de `cobrancas` e o extrato é de
 * `pagamentos` — uma feature não importa de outra. Só o extrato sabe o id das parcelas de cada
 * pedido, e é com eles que o PIX abre.
 */
export default function PaginaDosMeusPedidos() {
  const extrato = useExtrato()
  const navegar = useNavigate()

  /**
   * Depois de pedir, cai no PIX das parcelas novas.
   *
   * O extrato é relido antes: as parcelas nasceram na requisição do pedido, e é a releitura que
   * traz os ids delas. Sem parcela a pagar — o pedido virou crédito, ou a quantidade diminuiu —, a
   * tela fica onde está, com o pedido já na lista.
   */
  const aoPedir = async (pedido: Pedido) => {
    const { data } = await extrato.refetch()
    const ids = paraPagar(data?.parcelas, pedido)

    if (ids.length > 0) navegar(rotaDoPagamentoEmLote(ids))
  }

  return <MeusPedidosPage aoPedir={aoPedir} AcoesDaLinha={AcoesDaLinha} AcoesDoResumo={AcoesDoResumo} />
}

/** O lote inclui só parcelas dos pedidos confirmados, disponíveis para pagamento no extrato. */
function AcoesDoResumo({ pedidos }: { pedidos: Pedido[] }) {
  const extrato = useExtrato()
  const ids = [
    ...new Set(
      pedidos
        .filter((pedido) => pedido.status === 'Confirmado')
        .flatMap((pedido) => paraPagar(extrato.data?.parcelas, pedido)),
    ),
  ]

  if (extrato.isPending) return <Button disabled>Carregando pagamento…</Button>
  if (extrato.isError)
    return (
      <Button variant="outline" onClick={() => void extrato.refetch()}>
        Tentar carregar pagamento
      </Button>
    )
  if (ids.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        Nenhuma parcela disponível para pagar agora. Confira a situação em{' '}
        <Link to={ROTAS.extrato} className="text-foreground underline">
          Minhas parcelas
        </Link>
        .
      </p>
    )

  return (
    <Button asChild>
      <Link to={rotaDoPagamentoEmLote(ids)}>
        <IconePix />
        Pagar com PIX
      </Link>
    </Button>
  )
}

/**
 * "Pagar" leva ao PIX de tudo o que falta do pedido — à vista ou o restante do parcelado, num QR
 * só. Some quando não há o que pagar: quitado, cancelado, ou com o aviso de pagamento na fila.
 */
function AcoesDaLinha({ pedido }: { pedido: Pedido }) {
  const extrato = useExtrato()
  const ids = pedido.status === 'Confirmado' ? paraPagar(extrato.data?.parcelas, pedido) : []

  if (ids.length === 0) return null

  return (
    <Button asChild variant="outline" size="sm">
      <Link to={rotaDoPagamentoEmLote(ids)}>Pagar</Link>
    </Button>
  )
}
