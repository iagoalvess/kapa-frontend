import { ListFilter } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * O botão "Filtros" ao lado da busca e o painel que ele abre, com os filtros que não precisam ficar
 * à vista. O número no botão diz quantos estão ligados, já que o painel fechado os esconde.
 *
 * `popover` nativo: clique fora e Esc fecham sem uma linha de JS. A posição, presa ao botão, vem de
 * `[data-painel]` em `styles/index.css`. A âncora tem nome fixo: é um painel de filtros por tela.
 *
 * @param id Id do painel, único na tela.
 * @param ligados Quantos filtros do painel estão ligados.
 * @param largura Utilitário de largura do painel. O padrão cabe uma fileira de pílulas de filtro;
 *   quem tem campo largo dentro — dois `<input type="date">`, que o Chrome não deixa encolher —
 *   passa uma maior, sempre com um teto em `vw` para o painel não estourar a tela do celular.
 */
export function BotaoDeFiltros({
  id,
  ligados,
  largura = 'w-72',
  children,
}: {
  id: string
  ligados: number
  largura?: string
  children: ReactNode
}) {
  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        className={cn(
          'focus-visible:ring-ring inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors [anchor-name:--filtros] focus-visible:ring-2 focus-visible:outline-none',
          ligados
            ? 'bg-primary text-primary-foreground border-primary'
            : 'text-muted-foreground border-border hover:bg-card',
        )}
      >
        Filtros
        {/* O espaço separa rótulo e número para o leitor de tela ("Filtros 1"); no visual, o `gap` espaça. */}
        {ligados ? ' ' : null}
        {ligados ? (
          <span className="bg-card text-foreground inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[11px] font-medium">
            {ligados}
          </span>
        ) : null}
        <ListFilter className="size-4" aria-hidden />
      </button>

      <div
        id={id}
        popover="auto"
        data-painel=""
        className={cn(
          'bg-card shadow-cartao text-foreground rounded-2xl border p-4 [position-anchor:--filtros]',
          largura,
        )}
      >
        {children}
      </div>
    </>
  )
}
