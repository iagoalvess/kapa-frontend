import { ChevronRight, LoaderCircle, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { DialogoDeInformacoes } from '@/components/DialogoDeInformacoes'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { cn } from '@/lib/utils'

interface Base {
  titulo: string
  icone: LucideIcon
}

export type AtalhoDaPagina = Base &
  (
    | { para: string }
    | { dialogo: { titulo: string; descricao: string; conteudo: ReactNode } }
    | { aoAcionar: () => void; desabilitado?: boolean; carregando?: boolean }
  )

const classesDoAtalho =
  'hover:bg-brand-hover focus-visible:ring-primary-foreground flex min-h-14 min-w-0 items-center gap-2 px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60'

/** No celular, os destinos relacionados ficam após os indicadores, antes dos filtros da lista. */
export function AtalhosDaPagina({ atalhos }: { atalhos: AtalhoDaPagina[] }) {
  if (atalhos.length === 0) return null

  return (
    <nav
      aria-label="Mais nesta área"
      className={cn(
        'bg-primary text-primary-foreground border-primary/70 [&>*]:border-primary-foreground/25 -mx-4 grid border-y lg:hidden',
        atalhos.length > 1 && 'grid-cols-2 [&>:nth-child(even)]:border-l [&>:nth-child(n+3)]:border-t',
        atalhos.length > 1 && atalhos.length % 2 !== 0 && '[&>:last-child]:col-span-2',
      )}
    >
      {atalhos.map((atalho) => {
        const Icone = 'carregando' in atalho && atalho.carregando ? LoaderCircle : atalho.icone
        const conteudo = (
          <>
            <Icone
              className={cn('size-5 shrink-0', 'carregando' in atalho && atalho.carregando && 'animate-spin')}
              strokeWidth={1.75}
              aria-hidden
            />
            <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{atalho.titulo}</span>
            {'para' in atalho || 'dialogo' in atalho ? (
              <ChevronRight className="size-4 shrink-0 opacity-80" aria-hidden />
            ) : null}
          </>
        )
        if ('para' in atalho) {
          return (
            <LinkDaPagina key={atalho.titulo} to={atalho.para} className={classesDoAtalho}>
              {conteudo}
            </LinkDaPagina>
          )
        }
        if ('dialogo' in atalho) {
          return (
            <DialogoDeInformacoes
              key={atalho.titulo}
              titulo={atalho.dialogo.titulo}
              descricao={atalho.dialogo.descricao}
              gatilho={
                <button type="button" className={classesDoAtalho}>
                  {conteudo}
                </button>
              }
            >
              {atalho.dialogo.conteudo}
            </DialogoDeInformacoes>
          )
        }
        return (
          <button
            key={atalho.titulo}
            type="button"
            className={classesDoAtalho}
            onClick={atalho.aoAcionar}
            disabled={atalho.desabilitado || atalho.carregando}
            aria-busy={atalho.carregando || undefined}
          >
            {conteudo}
          </button>
        )
      })}
    </nav>
  )
}
