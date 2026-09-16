import { Pin } from 'lucide-react'
import { Link } from 'react-router'
import { Avatar } from '@/components/Avatar'
import { Selo } from '@/components/Selo'
import { TextoEmMarkdown } from '@/components/TextoEmMarkdown'
import { rotaDoAviso } from '@/config/rotas'
import { formatarDataHora, formatarDataRelativa } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { Aviso } from '../types/comunicacao.types'

/**
 * Um aviso na lista da esquerda: título, as primeiras palavras, autor e há quanto tempo.
 *
 * É a linha de uma lista, e não um cartão: quem leva sombra e respiro é o cartão que a contém. O
 * aviso aberto fica com o fundo da marca e `aria-current`, que é como o leitor de tela sabe qual
 * dos links da lista está sendo mostrado ao lado.
 *
 * O resumo é a variante de cartão do `TextoEmMarkdown`, cortada em duas linhas: numa coluna
 * estreita, três já empurram a lista para baixo da dobra.
 */
export function LinhaDoMural({ aviso, aberto }: { aviso: Aviso; aberto: boolean }) {
  const autor = aviso.autor ?? 'Comissão'

  return (
    <li>
      <Link
        to={rotaDoAviso(aviso.id)}
        aria-current={aberto ? 'true' : undefined}
        className={cn(
          'grid gap-1.5 border-l-2 px-4 py-3',
          aberto ? 'bg-brand-tint border-brand' : 'hover:bg-border/40 border-transparent',
        )}
      >
        <div className="flex items-start gap-2">
          {aviso.fixado ? <Pin className="text-brand-text mt-0.5 size-3.5 shrink-0" aria-hidden /> : null}
          <h3 className="text-foreground min-w-0 flex-1 text-sm leading-snug font-medium">{aviso.titulo}</h3>
          <time
            dateTime={aviso.publicado_em}
            title={formatarDataHora(aviso.publicado_em)}
            className="text-muted-foreground shrink-0 text-[11px]"
          >
            {formatarDataRelativa(aviso.publicado_em)}
          </time>
        </div>

        <TextoEmMarkdown conteudo={aviso.conteudo} variante="resumo" className="line-clamp-2 text-xs" />

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Avatar nome={autor} semente={aviso.publicado_por_usuario_id} className="size-5 text-[9px]" />
          <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">{autor}</span>
          {aviso.destaque ? <Selo tom="marca">Importante</Selo> : null}
          {aviso.visibilidade === 'SomenteComissao' ? <Selo tom="cinza">Só comissão</Selo> : null}
        </div>
      </Link>
    </li>
  )
}
