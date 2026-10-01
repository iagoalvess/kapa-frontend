import { Check, Clock3, X } from 'lucide-react'
import { Dica } from '@/components/Dica'
import { cn } from '@/lib/utils'
import { ROTULOS_DE_SITUACAO, type SituacaoDoEvento } from '@/types/agenda'

const INDICADORES = {
  Confirmado: { icone: Check, classe: 'bg-success text-primary-foreground' },
  AConfirmar: { icone: Clock3, classe: 'bg-warning-bg text-warning-text' },
  Cancelado: { icone: X, classe: 'bg-neutral-bg text-neutral-text' },
} as const

/** Indicador compacto com descrição acessível, sem depender apenas da cor. */
export function IndicadorDoEvento({ situacao }: { situacao: SituacaoDoEvento }) {
  const { icone: Icone, classe } = INDICADORES[situacao]
  return (
    <Dica dica={ROTULOS_DE_SITUACAO[situacao]}>
      <span className={cn('inline-flex size-5 shrink-0 items-center justify-center rounded-full', classe)}>
        <Icone className="size-3.5" aria-hidden />
        <span className="sr-only">{ROTULOS_DE_SITUACAO[situacao]}</span>
      </span>
    </Dica>
  )
}
