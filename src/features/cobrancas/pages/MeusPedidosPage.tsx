import { ReceiptText } from 'lucide-react'
import { AtalhosDaPagina } from '@/components/AtalhosDaPagina'
import { CircleCheck, Package, ShoppingBag, Wallet } from 'lucide-react'
import type { ComponentType } from 'react'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Cartao } from '@/components/Cartao'
import { CartaoDeValor } from '@/components/CartaoDeValor'
import { EsqueletoDeCartao, EsqueletoDeTabela } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { useTelaGrande } from '@/hooks/useTelaGrande'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { FiltrosDaVitrine, VitrineDeItens } from '../components/VitrineDeItens'
import { useMeusPedidos } from '../hooks/usePedidos'
import { type Pedido } from '../types/cobrancas.types'

/**
 * A vitrine do formando à esquerda — o que ele pode pedir, e quanto já pediu de cada item — e o
 * pagamento à direita.
 *
 * A lista de "Seus pedidos" saiu: a vitrine já diz, item a item, o que foi pedido ("Você pediu 2
 * unidades") e deixa ajustar. O resumo do que falta pagar, esse não se repete na vitrine, e por isso
 * continua aqui ao lado.
 */
export default function MeusPedidosPage({
  AcoesDoResumo,
  aoPedir,
}: {
  AcoesDoResumo?: ComponentType<{ pedidos: Pedido[] }>
  aoPedir?: (pedido: Pedido) => void
}) {
  const telaGrande = useTelaGrande()
  const meus = useMeusPedidos()
  const confirmados = (meus.data ?? []).filter((pedido) => pedido.status === 'Confirmado')
  const soma = (campo: (pedido: Pedido) => number) =>
    meus.data ? confirmados.reduce((total, pedido) => total + campo(pedido), 0) : null
  const total = soma((pedido) => pedido.total_em_centavos)
  const pago = soma((pedido) => pedido.pago_em_centavos)
  const pendentes = confirmados.filter((pedido) => !pedido.quitado)
  const resumoDoPagamento =
    meus.data && total !== null && pago !== null && confirmados.length > 0 ? (
      <CartaoDeValor
        titulo={pendentes.length > 0 ? 'Pagamento dos pedidos' : 'Pedidos pagos'}
        destaque={pendentes.length > 0}
        rotulo="Falta pagar"
        valor={formatarCentavos(total - pago)}
        nota={
          pendentes.length > 0
            ? `${formatarNumero(pendentes.length)} ${pendentes.length === 1 ? 'pedido aguardando' : 'pedidos aguardando'} pagamento.`
            : 'Todos os seus pedidos confirmados estão pagos.'
        }
        acao={AcoesDoResumo && pendentes.length > 0 ? <AcoesDoResumo pedidos={confirmados} /> : null}
        rodape="As parcelas aparecem em Minhas parcelas. Descontos e encargos são calculados na hora de pagar."
      />
    ) : null

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo dos meus pedidos"
        indicadores={[
          { rotulo: 'Pedidos', valor: meus.data ? confirmados.length : null, icone: Package },
          {
            rotulo: 'Total pedido',
            valor: total === null ? null : formatarCentavos(total),
            icone: ShoppingBag,
          },
          { rotulo: 'Já pago', valor: pago === null ? null : formatarCentavos(pago), icone: CircleCheck },
          {
            rotulo: 'Falta pagar',
            valor: total === null || pago === null ? null : formatarCentavos(total - pago),
            icone: Wallet,
          },
        ]}
      />

      <AtalhosDaPagina atalhos={[{ titulo: 'Minhas parcelas', para: ROTAS.extrato, icone: ReceiptText }]} />

      {!telaGrande ? resumoDoPagamento : null}

      <FiltrosDaVitrine />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <VitrineDeItens aoPedir={aoPedir} />
        </div>

        <div className="grid min-w-0 gap-5 max-lg:contents">
          {meus.isPending ? (
            <EsqueletoDeCartao>
              <EsqueletoDeTabela colunas={2} />
            </EsqueletoDeCartao>
          ) : null}
          {meus.isError ? (
            <ErroDaConsulta erro={meus.error} aoTentarDeNovo={() => void meus.refetch()} />
          ) : null}

          {telaGrande ? resumoDoPagamento : null}

          <Cartao
            titulo="Minhas parcelas"
            className="hidden lg:grid"
            descricao="Acompanhe vencimentos, pagamentos e comprovantes."
          >
            <Button asChild variant="outline" size="sm" className="justify-self-start">
              <LinkDaPagina to={ROTAS.extrato}>Ver minhas parcelas</LinkDaPagina>
            </Button>
          </Cartao>
        </div>
      </div>
    </>
  )
}
