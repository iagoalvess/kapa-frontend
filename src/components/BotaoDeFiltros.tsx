import { ListFilter } from 'lucide-react'
import { createContext, type ReactNode, use } from 'react'
import { cn } from '@/lib/utils'

/**
 * O que a barra de filtros põe no painel da tela, acima do que a tela pôs — no celular, as pílulas de
 * situação, que lá saem da linha (Sprint 41). Por contexto porque o `BotaoDeFiltros` é montado pela
 * tela: assim nenhuma tela precisa saber que, no celular, o painel dela ganha mais uma seção.
 */
export const ContextoDoPainelDeFiltros = createContext<{ conteudo: ReactNode; ligados: number } | null>(null)

/**
 * O botão "Filtros" ao lado da busca e o painel que ele abre, com os filtros que não precisam ficar
 * à vista. O número no botão diz quantos estão ligados, já que o painel fechado os esconde.
 *
 * `popover` nativo: clique fora e Esc fecham sem uma linha de JS. A posição, presa ao botão, vem de
 * `[data-painel]` em `styles/index.css`. A âncora tem nome fixo: é um painel de filtros por tela.
 *
 * No celular (Sprint 41) o botão é só o ícone, do tamanho do dedo, e o painel abre embaixo dele na
 * largura da tela.
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
  const daBarra = use(ContextoDoPainelDeFiltros)
  const total = ligados + (daBarra?.ligados ?? 0)

  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        className={cn(
          'focus-visible:ring-ring relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors [anchor-name:--filtros] focus-visible:ring-2 focus-visible:outline-none max-lg:size-10 max-lg:justify-center max-lg:px-0',
          total
            ? 'bg-primary text-primary-foreground border-primary'
            : 'text-muted-foreground border-border hover:bg-card',
        )}
      >
        <span className="max-lg:sr-only">Filtros</span>
        {/* O espaço separa rótulo e número para o leitor de tela ("Filtros 1"); no visual, o `gap` espaça. */}
        {total ? ' ' : null}
        {total ? (
          <span className="bg-card text-foreground inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[11px] font-medium max-lg:absolute max-lg:-top-1 max-lg:-right-1 max-lg:border">
            {total}
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
          'max-lg:w-[calc(100vw-2rem)]',
        )}
      >
        {daBarra ? (
          <div className="grid gap-4">
            {daBarra.conteudo}
            <div>{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </>
  )
}
