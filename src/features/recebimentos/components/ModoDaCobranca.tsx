import { Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Interruptor } from '@/components/Interruptor'
import { Selo } from '@/components/Selo'
import { formatarData } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
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
export function ModoDaCobranca({ desde, escreve }: { desde: string | null; escreve: boolean }) {
  const configurar = useConfigurarCobranca()
  const [pedido, definirPedido] = useState<boolean>()
  const ligada = desde !== null

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
    <section aria-label="Cobrança dos formandos" className="bg-muted grid gap-3 rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-foreground flex items-center gap-2 font-medium">
          <Zap className="size-4" aria-hidden />
          Cobrar pelo Mercado Pago
          {ligada ? <Selo tom="sucesso">Ligada</Selo> : <Selo tom="neutro">Desligada</Selo>}
        </p>
        {escreve ? (
          <Interruptor
            ligado={ligada}
            rotulo="Cobrar parcelas e opcionais pelo Mercado Pago"
            aoAlternar={definirPedido}
            desabilitado={configurar.isPending}
          />
        ) : null}
      </div>

      <p className="text-muted-foreground text-sm">
        {ligada
          ? `Os formandos pagam parcelas e itens opcionais pelo Mercado Pago. O pagamento é confirmado automaticamente. Esta opção foi ligada em ${formatarData(desde)}.`
          : 'Os formandos pagam pelos meios escolhidos pela comissão e avisam quando pagam. Se você ligar esta opção, eles passarão a pagar pelo Mercado Pago, com confirmação automática. As vendas da loja continuam pelo Mercado Pago.'}
      </p>

      <DialogoDeConfirmacao
        aberto={pedido !== undefined}
        aoFechar={() => definirPedido(undefined)}
        titulo={pedido ? 'Cobrar pelo Mercado Pago?' : 'Voltar às formas de pagamento da comissão?'}
        descricao={
          pedido
            ? 'Os formandos passarão a pagar pelo Mercado Pago e não precisarão avisar quando pagarem. Os meios da comissão deixam de aparecer para eles. Se alguém pagar por fora, a tesouraria poderá registrar o pagamento.'
            : 'Os formandos voltarão a pagar pelas formas escolhidas pela comissão e a avisar quando pagarem. A tesouraria conferirá esses pagamentos. A loja continuará vendendo pelo Mercado Pago.'
        }
        rotulo={pedido ? 'Ligar' : 'Voltar às formas da comissão'}
        aoConfirmar={confirmar}
      />
    </section>
  )
}
