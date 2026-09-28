import { CircleCheck, Package, ShoppingBag, Wallet } from 'lucide-react'
import type { ComponentType } from 'react'
import { Link } from 'react-router'
import { Cartao } from '@/components/Cartao'
import { CartaoDeValor } from '@/components/CartaoDeValor'
import { EsqueletoDeCartao, EsqueletoDeTabela } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { cn } from '@/lib/utils'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { IconeDoTipo } from '../components/IconeDoTipo'
import { SituacaoDoPedido } from '../components/SituacaoDoPedido'
import { FiltrosDaVitrine, VitrineDeItens } from '../components/VitrineDeItens'
import { useMeusPedidos } from '../hooks/usePedidos'
import { type Pedido, rotuloDoItem } from '../types/cobrancas.types'

/** Vitrine e acompanhamento lado a lado; o pagamento é composto por app, que conhece o extrato. */
export default function MeusPedidosPage({
  AcoesDaLinha,
  AcoesDoResumo,
  aoPedir,
}: {
  AcoesDaLinha?: ComponentType<{ pedido: Pedido }>
  AcoesDoResumo?: ComponentType<{ pedidos: Pedido[] }>
  aoPedir?: (pedido: Pedido) => void
}) {
  const meus = useMeusPedidos()
  const confirmados = (meus.data ?? []).filter((pedido) => pedido.status === 'Confirmado')
  const soma = (campo: (pedido: Pedido) => number) =>
    meus.data ? confirmados.reduce((total, pedido) => total + campo(pedido), 0) : null
  const total = soma((pedido) => pedido.total_em_centavos)
  const pago = soma((pedido) => pedido.pago_em_centavos)
  const pendentes = confirmados.filter((pedido) => !pedido.quitado)

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

      <FiltrosDaVitrine />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <VitrineDeItens aoPedir={aoPedir} />
        </div>
        <div className="grid min-w-0 gap-5">
          {meus.isPending ? (
            <EsqueletoDeCartao>
              <EsqueletoDeTabela colunas={2} />
            </EsqueletoDeCartao>
          ) : null}
          {meus.isError ? <ErroDaConsulta erro={meus.error} /> : null}

          {meus.data && total !== null && pago !== null && confirmados.length > 0 ? (
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
          ) : null}

          {meus.data && meus.data.length > 0 ? (
            <Cartao
              titulo="Seus pedidos"
              descricao={`${formatarNumero(meus.data.length)} ${meus.data.length === 1 ? 'pedido' : 'pedidos'}`}
            >
              <ul className="grid gap-4" aria-label="Pedidos realizados">
                {meus.data.map((pedido) => (
                  <LinhaDoPedido key={pedido.id} pedido={pedido} AcoesDaLinha={AcoesDaLinha} />
                ))}
              </ul>
              <dl className="grid gap-2 border-t pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Total pedido</dt>
                  <dd className="tabular-nums">{formatarCentavos(total ?? 0)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Já pago</dt>
                  <dd className="tabular-nums">{formatarCentavos(pago ?? 0)}</dd>
                </div>
              </dl>
            </Cartao>
          ) : null}

          <Cartao titulo="Minhas parcelas" descricao="Acompanhe vencimentos, pagamentos e comprovantes.">
            <Button asChild variant="outline" size="sm" className="justify-self-start">
              <Link to={ROTAS.extrato}>Ver minhas parcelas</Link>
            </Button>
          </Cartao>
        </div>
      </div>
    </>
  )
}

/** O pedido mantém situação e valores individuais, inclusive quando foi cancelado. */
function LinhaDoPedido({
  pedido,
  AcoesDaLinha,
}: {
  pedido: Pedido
  AcoesDaLinha?: ComponentType<{ pedido: Pedido }>
}) {
  return (
    <li
      className={cn(
        'grid gap-3 border-b pb-4 last:border-0 last:pb-0',
        pedido.status === 'Cancelado' && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        <IconeDoTipo tipo={pedido.tipo} />
        <div className="grid min-w-0 gap-1">
          <h3 className="text-foreground text-sm font-medium break-words">{rotuloDoItem(pedido)}</h3>
          <p className="text-muted-foreground text-xs">
            {formatarNumero(pedido.quantidade)} {pedido.quantidade === 1 ? 'unidade' : 'unidades'} ·{' '}
            <span>{pedido.parcelas === 1 ? 'À vista' : `Em ${formatarNumero(pedido.parcelas)}×`}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SituacaoDoPedido pedido={pedido} />
        {AcoesDaLinha ? <AcoesDaLinha pedido={pedido} /> : null}
      </div>
      <p className="text-muted-foreground flex flex-wrap justify-between gap-2 text-xs">
        <span>Total {formatarCentavos(pedido.total_em_centavos)}</span>
        <span>Pago {formatarCentavos(pedido.pago_em_centavos)}</span>
      </p>
    </li>
  )
}
