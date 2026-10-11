import type { ReactNode } from 'react'
import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import { cn } from '@/lib/utils'

/**
 * O gráfico sem dado: linhas usam uma grade vazia; roscas mostram somente a frase.
 *
 * Os cartões continuam no mesmo lugar quando não há movimento. Na rosca basta explicar o que
 * falta, como nos outros quadros; o gráfico de linhas mantém sua grade na altura do desenho.
 *
 * @param forma `linha` desenha a grade do gráfico mês a mês; `rosca`, somente a mensagem.
 * @param children O que falta e quando aparece, numa frase.
 */
export function GraficoVazio({
  forma = 'linha',
  className,
  children,
}: {
  forma?: 'linha' | 'rosca'
  className?: string
  children: ReactNode
}) {
  if (forma === 'rosca') return <p className={cn('text-muted-foreground text-sm', className)}>{children}</p>

  return (
    <div className={cn('relative grid h-56 lg:h-[240px]', className)}>
      {/* As linhas da grade, na mesma posição das do gráfico: o vazio tem a cara dele. */}
      <div className="absolute inset-0 grid grid-rows-4" aria-hidden>
        {[0, 1, 2, 3].map((linha) => (
          <div key={linha} className="border-border border-t border-dashed" />
        ))}
        <div className="border-border absolute inset-x-0 bottom-0 border-t" />
      </div>
      <div className="relative grid place-content-center justify-items-center gap-2 text-center">
        <img src={mascoteCofrinho} alt="" className="w-20 drop-shadow-lg" />
        <p className="bg-card text-muted-foreground max-w-sm rounded-md px-2 text-sm">{children}</p>
      </div>
    </div>
  )
}
