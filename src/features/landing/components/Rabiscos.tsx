import { cn } from '@/lib/utils'

/** Os traços à mão do mural do Hero, que os criativos do Instagram repetem: coração, sublinhado e risquinhos. */
export function Coracao({ alto = false, className }: { alto?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn(alto ? 'rotate-3' : '-rotate-6', className)}>
      <g fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        {alto ? (
          /* O coração que a pessoa desenha esticado: estreito, alto e com a ponta puxada para baixo. */
          <path d="M12.1 22.6C10.3 19.2 6.9 15.5 6.2 11.8 5.5 8 7.4 4.5 9.9 5.1c1.3.3 2 1.5 2.3 2.8.8-1.5 1.7-2.5 3.1-2.6 2.6-.2 4.1 3.3 3.1 6.7-1 3.3-3.9 6.8-5.8 9.7" />
        ) : (
          <>
            {/* Um lóbulo maior que o outro e o traço que não fecha na ponta: é o que tira o ar de ícone. */}
            <path d="M11.4 21.4C8.2 19 3.5 15.4 3.1 11 2.7 7.3 5.6 4 8.7 5c1.6.5 2.6 1.9 3.1 3.3 1.4-2.1 2.8-3.4 4.9-3.3 3.4.1 5.1 3.2 3.8 6.6-1 2.6-3.3 4.9-5.9 6.9" />
            {/* A segunda passada da caneta, repassando a curva de cima à esquerda. */}
            <path d="M4.6 8.6C5.6 6.7 7.2 6 8.8 6.6" opacity="0.65" />
          </>
        )}
      </g>
    </svg>
  )
}

/**
 * Sublinhado à mão: um traço só, em arco virado para baixo — as pontas caem, o meio sobe.
 *
 * `preserveAspectRatio="none"` estica a curva na largura da frase, e `non-scaling-stroke` mantém a
 * espessura constante mesmo com esse esticamento.
 */
export function Rabisco({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 32"
      preserveAspectRatio="none"
      aria-hidden
      className={cn('overflow-visible', className)}
    >
      <path
        d="M4 27Q150 2 296 23"
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** Dois traços soltos, do tipo que a gente rabisca na margem do caderno. */
export function Risquinhos({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden className={className}>
      <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
        <path d="M5.5 3.5 10 20" />
        <path d="M23 5.5 17.5 21" />
      </g>
    </svg>
  )
}
