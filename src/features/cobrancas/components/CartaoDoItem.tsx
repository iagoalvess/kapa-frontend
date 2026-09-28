import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { formatarCentavos, formatarData, formatarDataHora, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { type Opcional, type Pedido, rotuloDoItem } from '../types/cobrancas.types'
import { IconeDoTipo } from './IconeDoTipo'

/**
 * Um item da vitrine: o que é, quanto custa e o botão de pedir.
 *
 * Três honestidades que a tela precisa ter:
 *
 * - **"Restam 12" quer dizer reservados, não pagos.** Sem baixa automática, a diferença entre
 *   pedido e dinheiro existe — e é a Gestão, na tela de Pedidos, que vê a conta inteira.
 * - **Item sem estoque não mostra contagem.** Número onde não há teto é ruído.
 * - **Antes da abertura, a data no lugar do botão, sem contagem regressiva.** Relógio na tela
 *   transforma pedido de convite em leilão.
 *
 * Não há aviso de prazo de reserva: a reserva não expira sozinha (decisão 9), e prometer um relógio
 * que não existe é pior que não ter.
 *
 * @param item O item, como a vitrine o recebe.
 * @param pedido O pedido que a pessoa já tem deste item, se tiver.
 * @param aoPedir Abre o diálogo de pedido.
 */
export function CartaoDoItem({
  item,
  pedido,
  aoPedir,
}: {
  item: Opcional
  pedido?: Pedido
  aoPedir: () => void
}) {
  const esgotado = item.disponivel === 0
  const meu = pedido && pedido.status === 'Confirmado' ? pedido : undefined

  return (
    <article
      className={cn(
        'grid items-center gap-4 rounded-xl border-b p-3 @min-[42rem]:grid-cols-[minmax(0,1fr)_10rem_9rem]',
        meu && 'bg-success-bg border-transparent',
      )}
    >
      <div className="flex items-start gap-3">
        <IconeDoTipo tipo={item.tipo} />
        <div className="grid min-w-0 gap-0.5">
          <h3 className="text-foreground font-medium break-words">{rotuloDoItem(item)}</h3>
          <p className="text-muted-foreground text-sm">
            <span className="tabular-nums">{formatarCentavos(item.valor_em_centavos)}</span> cada
            {item.numero_de_parcelas > 1 ? ` · até ${item.numero_de_parcelas}×` : null}
            {item.limite_por_formando
              ? ` · até ${formatarNumero(item.limite_por_formando)} por formando`
              : null}
          </p>
        </div>
      </div>

      <div className="grid justify-items-start gap-2">
        {/* Só com teto: a contagem existe para dizer que pode acabar. */}
        {item.disponivel !== null ? (
          <p className={esgotado ? 'text-sinal-negativo-text text-sm' : 'text-muted-foreground text-sm'}>
            {esgotado
              ? 'Esgotado'
              : `Restam ${formatarNumero(item.disponivel)} de ${formatarNumero(item.estoque ?? 0)}`}
          </p>
        ) : null}

        {meu ? (
          <p className="text-sm">
            <Selo tom="sucesso">
              Você pediu {formatarNumero(meu.quantidade)}
              {meu.quantidade === 1 ? ' unidade' : ' unidades'}
            </Selo>
          </p>
        ) : null}

        {item.pedidos_ate_dia ? (
          <p className="text-texto-muted text-xs">Pedidos até {formatarData(item.pedidos_ate_dia)}.</p>
        ) : null}
      </div>

      {item.aberto_a_pedido ? (
        <Button
          variant="outline"
          size="sm"
          onClick={aoPedir}
          disabled={esgotado && !meu}
          className="justify-self-start @min-[42rem]:justify-self-end"
        >
          {meu ? 'Mudar quantidade' : 'Pedir'}
        </Button>
      ) : (
        <p className="text-muted-foreground text-sm">
          As vendas abrem em{' '}
          <span className="text-foreground font-medium">{formatarDataHora(item.abertura_de_vendas)}</span>.
        </p>
      )}
    </article>
  )
}
