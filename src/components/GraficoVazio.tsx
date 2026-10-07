import type { ReactNode } from 'react'
import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import { cn } from '@/lib/utils'

/**
 * O gráfico sem dado: a moldura dele, vazia, com o mascote e a frase no meio.
 *
 * Existe para o gráfico não sumir. Sumindo, o cartão do lado ganhava a linha inteira e a rosca
 * esticada quebrava a legenda — e a tela mudava de forma conforme a turma tinha ou não movimento.
 * A moldura tem a altura do gráfico de verdade, então nada pula quando o primeiro dado chega.
 *
 * @param forma `linha` desenha a grade do gráfico mês a mês; `rosca`, o anel vazio.
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
  if (forma === 'rosca')
    return (
      <div className={cn('flex h-full flex-wrap items-center justify-center gap-6', className)}>
        <div className="border-border grid size-44 shrink-0 place-items-center rounded-full border-[24px]">
          <img src={mascoteCofrinho} alt="" className="w-20 drop-shadow-lg" />
        </div>
        <p className="text-muted-foreground min-w-52 flex-1 text-sm">{children}</p>
      </div>
    )

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
