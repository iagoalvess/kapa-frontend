import type { ComponentProps } from 'react'
import { formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'

interface Props extends Omit<ComponentProps<'button'>, 'type'> {
  ativo: boolean
  /** Quantos registros o filtro traz. Ausente, a bolha some. */
  contagem?: number
  /**
   * `escuro` destaca o filtro ligado em preto; `claro` só o preenche de cinza — para a linha de
   * cima, a de visão, que não deve competir com os filtros de verdade.
   */
  tom?: 'escuro' | 'claro'
}

/**
 * Filtro em forma de pílula, com a contagem numa bolha à direita.
 *
 * É um botão com `aria-pressed`: o leitor de tela anuncia "pressionado" no filtro ligado, e o
 * teclado funciona sem nenhuma linha a mais.
 */
export function Chip({ ativo, contagem, tom = 'escuro', className, children, ...resto }: Props) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      className={cn(
        'focus-visible:ring-ring inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50',
        !ativo && 'text-muted-foreground hover:bg-card border-border bg-transparent',
        ativo && tom === 'escuro' && 'bg-primary text-primary-foreground border-primary',
        ativo && tom === 'claro' && 'bg-border text-foreground border-transparent',
        className,
      )}
      {...resto}
    >
      {children}
      {/* O espaço separa rótulo e número para o leitor de tela ("Formando 2", não "Formando2");
          no visual, o `flex` o descarta e quem espaça é o `gap`. */}
      {contagem === undefined ? null : ' '}
      {contagem === undefined ? null : (
        <span
          className={cn(
            'inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[11px] font-medium',
            ativo && tom === 'escuro' ? 'bg-card text-foreground' : 'bg-border text-muted-foreground',
          )}
        >
          {formatarNumero(contagem)}
        </span>
      )}
    </button>
  )
}
