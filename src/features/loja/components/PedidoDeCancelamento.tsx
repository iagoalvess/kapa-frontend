import { useState } from 'react'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Button } from '@/components/ui/button'
import { formatarData, formatarDataHora } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { usePedirCancelamento } from '../hooks/useCancelamento'
import type { Compra } from '../types/loja.types'
import { CampoDoMotivo, EscolhaDeConvites } from './EscolhaDeConvites'

/**
 * O pedido de cancelamento do comprador, pelo link (Sprint 38, P1): o status do último pedido e o botão
 * de pedir.
 *
 * É um pedido, não um cancelamento (decisão 5): os convites continuam valendo até a comissão responder, e
 * quem devolve o dinheiro é a turma, nunca o Kapa (P7).
 *
 * @param token O segredo do link da compra.
 * @param compra A compra paga.
 */
export function PedidoDeCancelamento({ token, compra }: { token: string; compra: Compra }) {
  const pedido = compra.pedido_de_cancelamento

  return (
    <>
      {pedido?.status === 'Aberto' ? (
        <p className="bg-muted rounded-2xl p-4 text-sm">
          Você pediu o cancelamento de {pedido.convites === 1 ? '1 convite' : `${pedido.convites} convites`}{' '}
          em {formatarDataHora(pedido.pedido_em)}. Os convites continuam valendo até a comissão responder — a
          resposta chega por e-mail e aparece aqui.
        </p>
      ) : null}

      {pedido?.status === 'Recusado' ? (
        <p className="bg-muted rounded-2xl p-4 text-sm">
          A comissão recusou o seu pedido de cancelamento
          {pedido.respondido_em ? ` em ${formatarData(pedido.respondido_em)}` : null}
          {pedido.motivo_da_resposta ? `: “${pedido.motivo_da_resposta}”` : null}. Seus convites continuam
          valendo.
        </p>
      ) : null}

      {compra.pode_pedir_cancelamento ? <Pedir token={token} compra={compra} /> : null}
    </>
  )
}

function Pedir({ token, compra }: { token: string; compra: Compra }) {
  const [aberto, definirAberto] = useState(false)
  const [escolhidos, definirEscolhidos] = useState<string[]>([])
  const [motivo, definirMotivo] = useState('')
  const pedir = usePedirCancelamento(token)

  const abrir = () => {
    definirEscolhidos([])
    definirMotivo('')
    definirAberto(true)
  }

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault()
    pedir.mutate(
      { token, conviteIds: escolhidos, motivo: motivo.trim() || null },
      {
        onSuccess: () => {
          toast.success('Pedido enviado à comissão.')
          definirAberto(false)
        },
        onError: avisarErro,
      },
    )
  }

  return (
    <>
      <p className="text-muted-foreground text-sm">
        Precisa cancelar?{' '}
        <Button variant="link" className="h-auto p-0" onClick={abrir}>
          Pedir cancelamento
        </Button>
      </p>

      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo="Pedir o cancelamento?"
        descricao={`Quem vende os convites é a ${compra.turma}: a comissão aprova ou recusa, e, se aprovar, a devolução é feita por ela, por PIX. Até a resposta, os convites continuam valendo.`}
      >
        <form onSubmit={enviar} noValidate className="grid gap-4">
          <EscolhaDeConvites convites={compra.convites} escolhidos={escolhidos} aoMudar={definirEscolhidos} />
          <CampoDoMotivo
            valor={motivo}
            aoMudar={definirMotivo}
            rotulo="Motivo (opcional)"
            exemplo="Não vou conseguir ir"
          />
          <AcoesDoFormulario
            aoCancelar={() => definirAberto(false)}
            ocupado={pedir.isPending}
            desabilitado={escolhidos.length === 0}
            rotulo="Pedir cancelamento"
            rotuloOcupado="Enviando…"
            rotuloDeCancelar="Voltar"
          />
        </form>
      </DialogoDeFormulario>
    </>
  )
}
