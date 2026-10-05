import { cn } from '@/lib/utils'

/**
 * O divisor estrutural do Início: linha reta de 1px na cor do token `border` — a mesma família das
 * réguas de item de lista (agenda, mural) — com as pontas desvanecendo para o fundo em vez de cortar
 * seco na borda do contêiner. O charme desenhado da marca fica nos acentos (sublinhados do herói),
 * não na divisória entre blocos.
 *
 * No desktop, com `verticalNoDesktop`, o fio vira vertical e fica absoluto: no fluxo da grade ele
 * ganharia altura própria e empurraria as seções.
 */
export function TracoDoInicio({
  className,
  verticalNoDesktop = false,
}: {
  className?: string
  verticalNoDesktop?: boolean
}) {
  return (
    <div aria-hidden className={cn('pointer-events-none relative', className)}>
      <span
        className={cn('absolute inset-x-0 top-1/2 h-px', verticalNoDesktop && 'lg:hidden')}
        style={{
          background:
            'linear-gradient(90deg, transparent, var(--border) 12%, var(--border) 88%, transparent)',
        }}
      />
      {verticalNoDesktop ? (
        <span
          className="absolute inset-y-0 left-1/2 hidden w-px lg:block"
          style={{
            background:
              'linear-gradient(180deg, transparent, var(--border) 8%, var(--border) 92%, transparent)',
          }}
        />
      ) : null}
    </div>
  )
}
