import { Button } from '@/components/ui/button'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { Plano } from '../types/assinaturas.types'

const POR_CICLO = { Mensal: '/mês', Anual: '/ano' } as const

/**
 * Um plano, lado a lado com os outros.
 *
 * O recomendado ganha borda `--brand-border` e faixa `--brand` com texto `--on-brand`. O botão é o
 * primário do produto (`--cta-dark`), não o laranja: `--brand` é acento, não ação.
 *
 * @param aoContratar Chamado com o código do plano. Ausente, o botão fica desabilitado.
 * @param contratando Se o checkout deste plano está a caminho do provedor.
 */
export function CardDePlano({
  plano,
  aoContratar,
  contratando = false,
}: {
  plano: Plano
  aoContratar?: (codigo: string) => void
  contratando?: boolean
}) {
  return (
    <article
      aria-labelledby={`plano-${plano.codigo}`}
      className={cn(
        'bg-card shadow-cartao flex flex-col overflow-hidden rounded-2xl border',
        plano.recomendado ? 'border-brand-border border-2' : 'border-border',
      )}
    >
      {plano.recomendado ? (
        <p className="bg-brand text-on-brand px-5 py-1.5 text-center text-xs font-semibold tracking-wide uppercase">
          Recomendado
        </p>
      ) : null}

      <div className="flex flex-1 flex-col gap-4 p-5">
        <h2 id={`plano-${plano.codigo}`} className="text-foreground text-lg font-medium">
          {plano.nome}
        </h2>

        <p className="text-foreground">
          <span className="text-3xl font-semibold">{formatarCentavos(plano.precoEmCentavos)}</span>
          <span className="text-muted-foreground text-sm"> {POR_CICLO[plano.ciclo]}</span>
        </p>

        <p className="text-muted-foreground text-sm">
          Até {formatarNumero(plano.limiteDeFormandos)} formandos
        </p>

        <Button
          className="mt-auto"
          disabled={!aoContratar || contratando}
          onClick={() => aoContratar?.(plano.codigo)}
        >
          {contratando ? 'Indo para o pagamento…' : `Contratar ${plano.nome}`}
        </Button>
      </div>
    </article>
  )
}
