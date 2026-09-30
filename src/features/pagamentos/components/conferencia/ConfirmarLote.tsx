import { toast } from 'sonner'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Button } from '@/components/ui/button'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { useConfirmarInformes } from '../../hooks/useInformes'
import type { Informe } from '../../types/pagamentos.types'

interface PropsDoLote {
  informes: Informe[]
  total: number
  recebido: (informe: Informe) => number
  aoConcluir: () => void
}

/**
 * Quantos foram marcados e o botão que fecha o lote, à esquerda da contagem da lista.
 *
 * O botão leva só o essencial — "Confirmar · R$ 650,00"; quantos são fica no rótulo ao lado, na
 * mesma linha em que se lê quantos itens a lista tem. Nada marcado, nada disso aparece.
 */
export function ConfirmarLote({ informes, total, recebido, aoConcluir }: PropsDoLote) {
  const confirmar = useConfirmarInformes()
  const liberado = useEscritaLiberada()
  const quantidade = informes.length

  if (quantidade === 0) return null

  return (
    <div className="motion-safe:animate-entrar flex items-center gap-2">
      <span className="text-muted-foreground text-sm">
        {formatarNumero(quantidade)} {quantidade === 1 ? 'selecionado' : 'selecionados'}
      </span>

      <DialogoDeConfirmacao
        gatilho={
          <Button size="xs" disabled={!liberado || confirmar.isPending}>
            Confirmar · {formatarCentavos(total)}
          </Button>
        }
        titulo={`Confirmar ${formatarNumero(quantidade)} ${quantidade === 1 ? 'pagamento' : 'pagamentos'}, no total de ${formatarCentavos(total)}?`}
        descricao="A confirmação fica registrada em seu nome. O valor informado será registrado em cada parcela selecionada, e o formando receberá um e-mail."
        rotuloDeCancelar="Voltar"
        rotulo="Confirmar"
        aoConfirmar={() =>
          confirmar.mutate(
            informes.map((informe) => ({
              informe_id: informe.id,
              valor_recebido_em_centavos: recebido(informe),
            })),
            {
              onSuccess: ({ confirmados, ignorados }) => {
                toast.success(
                  `${formatarNumero(confirmados)} ${confirmados === 1 ? 'pagamento confirmado' : 'pagamentos confirmados'}.` +
                    (ignorados ? ` ${formatarNumero(ignorados)} já tinham sido conferidos.` : ''),
                )
                aoConcluir()
              },
              onError: avisarErro,
            },
          )
        }
      />
    </div>
  )
}
