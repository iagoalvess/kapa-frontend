import type { CSSProperties } from 'react'

const CONFETES = [
  { x: -52, y: -32, giro: -180, cor: 'var(--brand)' },
  { x: -38, y: -50, giro: 240, cor: 'var(--success-fill)' },
  { x: -22, y: -42, giro: -220, cor: 'var(--brand-soft)' },
  { x: -8, y: -58, giro: 320, cor: 'var(--brand)' },
  { x: 12, y: -48, giro: -280, cor: 'var(--success-fill)' },
  { x: 30, y: -54, giro: 260, cor: 'var(--brand-soft)' },
  { x: 46, y: -34, giro: -200, cor: 'var(--brand)' },
  { x: 56, y: -18, giro: 320, cor: 'var(--success-fill)' },
  { x: -44, y: -14, giro: 200, cor: 'var(--brand-soft)' },
  { x: 24, y: -24, giro: -320, cor: 'var(--brand)' },
  { x: -14, y: -28, giro: 280, cor: 'var(--success-fill)' },
  { x: 40, y: -12, giro: -240, cor: 'var(--brand-soft)' },
]

/** A mesma comemoração na landing e nos convites; a origem é a ponta da barra. */
export function ConfetesDaMeta() {
  return (
    <div className="pointer-events-none absolute top-1/2 right-1.5 z-10" aria-hidden>
      <span className="meta-onda border-brand absolute -inset-2 rounded-full border" />
      {CONFETES.map((confete, indice) => (
        <span
          key={indice}
          className="meta-confete absolute h-1.5 w-1 rounded-[1px]"
          style={
            {
              '--confete-x': `${confete.x}px`,
              '--confete-y': `${confete.y}px`,
              '--confete-giro': `${confete.giro}deg`,
              backgroundColor: confete.cor,
              animationDelay: `${(indice % 4) * 35}ms`,
              animationDuration: `${1050 + (indice % 3) * 130}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
