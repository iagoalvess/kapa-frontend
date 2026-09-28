import { useId, useState } from 'react'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { useCancelarPedido } from '../hooks/usePedidos'
import { rotuloDoItem, type Pedido } from '../types/cobrancas.types'

/**
 * Cancelar um pedido da turma — e é por aqui que o estoque volta (decisão 9).
 *
 * Só a tesouraria: a comissão lê a lista para responder ao formando, mas quem mexe em dívida é quem
 * responde pelo caixa. Com dinheiro já pago, o diálogo pede o crédito a devolver (P5): ele vira uma
 * parcela negativa do próprio pedido, que abate o que a pessoa ainda deve.
 *
 * Sem crédito e com parte paga, o pedido não some — ele encolhe para o que o pagamento já cobria
 * (P9), e só o excedente volta ao estoque. É a única saída que não escolhe entre travar o estoque
 * para sempre e ficar com o dinheiro de alguém.
 */
export function AcoesDoPedido({ pedido }: { pedido: Pedido }) {
  const { tem } = usePapel()
  const editavel = useEscritaLiberada()
  const cancelar = useCancelarPedido()
  const [aberto, definirAberto] = useState(false)
  const [credito, definirCredito] = useState(0)
  const campoDoCredito = useId()

  if (pedido.status === 'Cancelado' || !editavel || !tem(PAPEIS.tesoureiro)) return null

  const pago = pedido.pago_em_centavos > 0

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault()
    cancelar.mutate(
      { pedidoId: pedido.id, creditoEmCentavos: credito },
      {
        onSuccess: () => {
          toast.info('Pedido cancelado. O estoque voltou.')
          definirAberto(false)
        },
        onError: avisarErro,
      },
    )
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => definirAberto(true)}>
        Cancelar
      </Button>

      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo={`Cancelar ${rotuloDoItem(pedido).toLowerCase()} de ${pedido.nome}?`}
        descricao={
          pago
            ? `Já entraram ${formatarCentavos(pedido.pago_em_centavos)} por este pedido. Sem crédito, ele encolhe para o que o pagamento cobriu; com crédito, cai inteiro e o valor abate o que a pessoa ainda deve.`
            : 'As parcelas em aberto são canceladas e as unidades voltam ao estoque.'
        }
        largura="estreito"
      >
        <form onSubmit={enviar} noValidate className="grid gap-4">
          {pago ? (
            <div className="grid gap-2 text-sm">
              <label htmlFor={campoDoCredito} className="text-foreground w-fit font-medium">
                Crédito a devolver
              </label>
              <CampoDeMoeda id={campoDoCredito} value={credito} onChange={definirCredito} />
              <p className="text-texto-muted text-xs">
                Vira uma parcela negativa no nome dele. O PIX de volta é lançado como despesa no caixa, quando
                você fizer — reter parte é lançar um crédito menor que o pago.
              </p>
            </div>
          ) : null}

          <AcoesDoFormulario
            rotuloDeCancelar="Voltar"
            aoCancelar={() => definirAberto(false)}
            ocupado={cancelar.isPending}
            rotulo="Cancelar pedido"
            rotuloOcupado="Cancelando…"
          />
        </form>
      </DialogoDeFormulario>
    </>
  )
}
