import { Check, MessageSquareWarning, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AcaoComConfirmacao, AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { Cartao } from '@/components/Cartao'
import { Paginacao } from '@/components/Paginacao'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { formatarDataHora, formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { paginar } from '@/lib/paginar'
import { useAprovarPedido, usePedidosDeCancelamento, useRecusarPedido } from '../hooks/useCancelamento'
import type { PedidoNaGestao } from '../types/loja.types'
import { CampoDoMotivo } from './EscolhaDeConvites'
import { useTamanhoDaPagina } from '@/hooks/useTelaGrande'

/**
 * A fila de pedidos de cancelamento do comprador (Sprint 38, P1): aprovar é o cancelamento da Gestão,
 * com o pedido como origem; recusar pede motivo, que o comprador lê no link e no e-mail.
 *
 * Some quando não há pedido — a tela da loja não ganha um cartão vazio para uma coisa rara.
 */
export function PedidosDeCancelamento() {
  const tamanhoDaPagina = useTamanhoDaPagina()
  const pedidos = usePedidosDeCancelamento()
  const editavel = useEscritaLiberada()
  const [paginaPedida, definirPagina] = useState(1)
  const pagina = paginar(pedidos.data ?? [], paginaPedida, tamanhoDaPagina)

  if (!pedidos.data?.length) return null

  return (
    <Cartao
      titulo="Pedidos de cancelamento"
      icone={MessageSquareWarning}
      descricao="Os convites continuam valendo até a comissão responder."
    >
      <ul className="grid gap-2">
        {pagina.visiveis.map((pedido) => (
          <li key={pedido.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm">
            <div className="grid min-w-0 flex-1">
              <span className="font-medium">{pedido.nome ?? 'Dados apagados'}</span>
              <span className="text-muted-foreground text-xs">
                {formatarNumero(pedido.convites)} de {formatarNumero(pedido.quantidade_da_compra)}{' '}
                {pedido.quantidade_da_compra === 1 ? 'convite' : 'convites'} · {pedido.item} · pedido em{' '}
                {formatarDataHora(pedido.pedido_em)}
              </span>
              {pedido.motivo ? <span className="text-xs">“{pedido.motivo}”</span> : null}
            </div>
            {editavel ? <Resposta pedido={pedido} /> : null}
          </li>
        ))}
      </ul>
      <Paginacao
        pagina={pagina.pagina}
        totalPaginas={pagina.totalPaginas}
        total={pagina.total}
        aoMudar={definirPagina}
      />
    </Cartao>
  )
}

function Resposta({ pedido }: { pedido: PedidoNaGestao }) {
  const aprovar = useAprovarPedido()
  const recusar = useRecusarPedido()
  const [recusando, definirRecusando] = useState(false)
  const [motivo, definirMotivo] = useState('')
  const quem = pedido.nome ?? 'comprador'

  const enviarRecusa = (evento: React.FormEvent) => {
    evento.preventDefault()
    recusar.mutate(
      { pedidoId: pedido.id, motivo: motivo.trim() },
      {
        onSuccess: () => {
          toast.info('Pedido recusado. O comprador recebe o motivo por e-mail.')
          definirRecusando(false)
        },
        onError: avisarErro,
      },
    )
  }

  return (
    <>
      <AcoesDaLinha rotulo={`Responder o pedido de ${quem}`}>
        <AcaoComConfirmacao
          rotulo="Aprovar"
          descricaoAcessivel={`Aprovar o pedido de ${quem}`}
          icone={Check}
          tom="neutra"
          desabilitada={aprovar.isPending}
          confirmacao={{
            titulo: `Cancelar ${pedido.convites === 1 ? 'o convite' : `os ${pedido.convites} convites`} de ${quem}?`,
            descricao:
              'O convite deixa de valer, o lugar volta para a venda e a compra entra na lista a devolver. O PIX de volta é da comissão.',
            rotulo: 'Aprovar',
            aoConfirmar: () =>
              aprovar.mutate(pedido.id, {
                onSuccess: () => toast.info('Pedido aprovado. A compra está na lista a devolver.'),
                onError: avisarErro,
              }),
          }}
        />
        <AcaoDaLinha
          rotulo="Recusar"
          descricaoAcessivel={`Recusar o pedido de ${quem}`}
          icone={X}
          tom="perigo"
          onClick={() => {
            definirMotivo('')
            definirRecusando(true)
          }}
        />
      </AcoesDaLinha>

      <DialogoDeFormulario
        aberto={recusando}
        aoFechar={() => definirRecusando(false)}
        titulo={`Recusar o pedido de ${quem}?`}
        descricao="Os convites continuam valendo. O comprador lê o motivo no link da compra e no e-mail."
        largura="estreito"
      >
        <form onSubmit={enviarRecusa} noValidate className="grid gap-4">
          <CampoDoMotivo
            valor={motivo}
            aoMudar={definirMotivo}
            exemplo="Fora do prazo combinado pela turma"
          />
          <AcoesDoFormulario
            aoCancelar={() => definirRecusando(false)}
            ocupado={recusar.isPending}
            desabilitado={!motivo.trim()}
            rotulo="Recusar"
            rotuloOcupado="Recusando…"
            rotuloDeCancelar="Voltar"
          />
        </form>
      </DialogoDeFormulario>
    </>
  )
}
