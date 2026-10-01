import { useNavigate } from 'react-router'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Esqueleto } from '@/components/Esqueleto'
import { IconePix } from '@/components/IconePix'
import { Button } from '@/components/ui/button'
import { ROTAS, rotaDoPagamentoEmLote } from '@/config/rotas'
import type { Pedido } from '@/features/cobrancas'
import MeusPedidosPage from '@/features/cobrancas/pages/MeusPedidosPage'
import { useExtrato } from '@/features/pagamentos'
import { useEstadoComOrigem } from '@/hooks/useNavegacaoDaPagina'
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
  const estadoComOrigem = useEstadoComOrigem()

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

    if (ids.length > 0) navegar(rotaDoPagamentoEmLote(ids), { state: estadoComOrigem })
  }

  return <MeusPedidosPage aoPedir={aoPedir} AcoesDoResumo={AcoesDoResumo} />
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

  if (extrato.isPending) return <Esqueleto className="h-11 w-44 rounded-lg" />
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
        <LinkDaPagina to={ROTAS.extrato} className="text-foreground underline">
          Minhas parcelas
        </LinkDaPagina>
        .
      </p>
    )

  return (
    <Button asChild>
      <LinkDaPagina to={rotaDoPagamentoEmLote(ids)}>
        <IconePix />
        Pagar com PIX
      </LinkDaPagina>
    </Button>
  )
}
