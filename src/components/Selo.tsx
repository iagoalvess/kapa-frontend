import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TONS = {
  sucesso: 'bg-success-bg text-success-text',
  alerta: 'bg-warning-bg text-warning-text',
  perigo: 'bg-danger-bg text-danger-text',
  neutro: 'bg-muted text-muted-foreground',
  marca: 'bg-brand-tint text-brand-text',
} as const

/**
 * Etiqueta curta de estado ("Ativo", "Presidente"): fundo suave e texto da mesma família.
 *
 * @param tom Família de cor. `neutro` para o que não pede atenção.
 */
export function Selo({ tom = 'neutro', children }: { tom?: keyof typeof TONS; children: ReactNode }) {
  return (
    <span className={cn('inline-flex h-6 items-center rounded-md px-2 text-xs font-medium', TONS[tom])}>
      {children}
    </span>
  )
}
