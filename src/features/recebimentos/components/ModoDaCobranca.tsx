import { useId, useState } from 'react'
import { toast } from 'sonner'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { avisarErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
import { useConfigurarCobranca } from '../hooks/useMercadoPago'

/**
 * Um modo ou o outro (29/09/2026): ligada, parcelas e opcionais se pagam só pelo Mercado Pago, sem aviso nem
 * conferência; desligada, o formando vê só os meios da comissão e avisa o pagamento. A loja é sempre Mercado Pago.
 *
 * A troca passa por confirmação — muda o que toda a turma vê na tela de pagar —, e a API recusa enquanto há algo
 * no meio do caminho (aviso na fila, PIX de hoje em aberto); a mensagem dela diz o que fazer.
 *
 * @param desde Desde quando está ligada; nulo, desligada.
 * @param escreve Se quem vê pode trocar.
 */
export function ModoDaCobranca({
  desde,
  escreve,
  conectado = true,
  preparandoAutomatico = false,
  aoPreparar,
}: {
  desde: string | null
  escreve: boolean
  conectado?: boolean
  preparandoAutomatico?: boolean
  aoPreparar?: (automatico: boolean) => void
}) {
  const configurar = useConfigurarCobranca()
  const grupo = useId()
  const [pedido, definirPedido] = useState<boolean>()
  const ligada = desde !== null
  const selecionada = ligada || (!conectado && preparandoAutomatico)

  const confirmar = () => {
    const automatica = pedido === true
    definirPedido(undefined)
    configurar.mutate(
      { automatica },
      {
        onSuccess: () =>
          automatica
            ? toast.success('Cobrança pelo Mercado Pago ligada. Os formandos já pagam por ele.')
            : toast.info('Os formandos voltaram a ver as formas de pagamento da comissão.'),
        onError: avisarErro,
      },
    )
  }

  return (
    <section aria-label="Cobrança dos formandos" className="grid gap-3">
      <fieldset className="grid gap-3">
        <legend className="text-foreground text-base font-medium">Parcelas e itens opcionais</legend>
        <div className="divide-border grid divide-y">
          {[
            {
              automatica: false,
              titulo: 'Conferência manual',
              descricao: 'PIX, transferência ou dinheiro. A tesouraria confere.',
            },
            {
              automatica: true,
              titulo: 'Confirmação automática',
              descricao: 'PIX ou cartão pelo Mercado Pago. O Kapa confirma.',
            },
          ].map(({ automatica, titulo, descricao }) => {
            const ativo = selecionada === automatica
            const desabilitado = !escreve || configurar.isPending || (automatica && !conectado && !aoPreparar)

            return (
              <label
                key={titulo}
                className={cn('flex items-start gap-3 py-3', !desabilitado && 'cursor-pointer')}
              >
                <input
                  type="radio"
                  name={grupo}
                  aria-label={titulo}
                  checked={ativo}
                  disabled={desabilitado}
                  onChange={() => (conectado ? definirPedido(automatica) : aoPreparar?.(automatica))}
                  className="accent-brand focus-visible:ring-ring mt-1 size-4 shrink-0 focus-visible:ring-2 focus-visible:outline-none"
                />
                <span className="grid min-w-0 gap-1">
                  <span className={cn('text-foreground text-[15px] font-medium', ativo && 'text-brand-text')}>
                    {titulo}
                  </span>
                  <span className="text-muted-foreground text-sm">{descricao}</span>
                  {automatica && !conectado && !aoPreparar ? (
                    <span className="text-muted-foreground text-xs">
                      Conecte a conta abaixo para escolher.
                    </span>
                  ) : null}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
      {preparandoAutomatico && !conectado ? (
        <p className="text-muted-foreground text-sm">
          Depois de conectar, confirme a ativação. Até lá, o pagamento continua manual.
        </p>
      ) : null}

      <DialogoDeConfirmacao
        aberto={pedido !== undefined}
        aoFechar={() => definirPedido(undefined)}
        titulo={pedido ? 'Usar confirmação automática?' : 'Voltar à conferência manual?'}
        descricao={
          pedido
            ? 'Os formandos passarão a pagar pelo Mercado Pago e não precisarão avisar quando pagarem. Os meios da comissão deixam de aparecer para eles. Se alguém pagar por fora, a tesouraria poderá registrar o pagamento.'
            : 'Os formandos voltarão a pagar pelas formas escolhidas pela comissão e a avisar quando pagarem. A tesouraria conferirá esses pagamentos. A loja continuará vendendo pelo Mercado Pago.'
        }
        rotulo={pedido ? 'Usar automático' : 'Usar manual'}
        aoConfirmar={confirmar}
      />
    </section>
  )
}
