import { WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import mascoteErro from '@/assets/mascote/erro.webp'
import { cn } from '@/lib/utils'

/**
 * O mesmo desenho para falhas de carregamento, links inválidos e páginas indisponíveis.
 * As ações vêm de quem conhece a falha: repetir uma consulta, voltar ou pedir outro link.
 */
export function EstadoDeErro({
  titulo,
  descricao,
  children,
  compacto = false,
  erroDeRede = false,
  mascote = mascoteErro,
  nivelDoTitulo = 2,
  className,
}: {
  titulo: string
  descricao: ReactNode
  children?: ReactNode
  compacto?: boolean
  erroDeRede?: boolean
  mascote?: string
  nivelDoTitulo?: 1 | 2
  className?: string
}) {
  const Titulo = nivelDoTitulo === 1 ? 'h1' : 'h2'

  return (
    <div
      className={cn(
        'motion-safe:animate-entrar flex w-full flex-col items-center justify-center gap-6 px-4 text-center',
        compacto ? 'py-6' : 'min-h-[50svh] py-12',
        className,
      )}
    >
      <div className="relative isolate" aria-hidden="true">
        <div className="bg-brand-tint absolute inset-x-0 bottom-2 -z-10 aspect-square rounded-full" />
        <img
          src={mascote}
          alt=""
          className={cn('object-contain drop-shadow-lg', compacto ? 'size-28' : 'size-40 sm:size-48')}
        />
        {erroDeRede ? (
          <span className="bg-card text-brand-text border-brand-border absolute right-0 bottom-1 grid size-10 place-items-center rounded-full border shadow-sm">
            <WifiOff className="size-5" />
          </span>
        ) : null}
      </div>
      <div role="alert" className="grid w-full max-w-sm gap-2">
        <Titulo
          className={cn(
            'text-foreground font-semibold text-balance',
            compacto ? 'text-lg' : 'text-xl sm:text-2xl',
          )}
        >
          {titulo}
        </Titulo>
        <p className="text-muted-foreground text-sm leading-relaxed text-pretty">{descricao}</p>
      </div>
      {children ? <div className="flex w-full max-w-sm flex-col items-center gap-3">{children}</div> : null}
    </div>
  )
}
