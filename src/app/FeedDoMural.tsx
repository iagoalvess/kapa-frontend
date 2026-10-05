import { ChevronRight, Pin } from 'lucide-react'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { rotaDoAviso } from '@/config/rotas'
import { useAvisos } from '@/features/comunicacao'
import { formatarDataRelativa } from '@/lib/formato'

/** Quantos fixados cabem sem o Início virar uma segunda tela de mural. */
const QUANTOS = 3

/**
 * Os avisos fixados do mural, no Início.
 *
 * **Fixados, e não os mais recentes**: fixar é o gesto com que a comissão diz "isto todo mundo tem de
 * ver" — é a única lista do mural que faz sentido repetir fora dele. O sino ao lado cuida do que é novo
 * para cada pessoa; aqui é o que vale para a turma inteira, tenha sido lido ou não.
 */
export function FeedDoMural() {
  const avisos = useAvisos({ fixado: true, pagina: 1, tamanho: QUANTOS })
  const itens = avisos.data?.itens ?? []

  if (avisos.isError)
    return <ErroDaConsulta compacto erro={avisos.error} aoTentarDeNovo={() => void avisos.refetch()} />
  if (avisos.isPending) return <EsqueletoDeTexto linhas={3} />

  if (itens.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        A comissão ainda não fixou nenhum aviso. Os avisos do dia a dia continuam no mural.
      </p>
    )

  return (
    <ul className="grid">
      {itens.map((aviso) => (
        <li key={aviso.id} className="border-border border-b last:border-0">
          <LinkDaPagina
            to={rotaDoAviso(aviso.id)}
            className="hover:bg-muted/60 focus-visible:ring-ring -mx-2 flex min-w-0 items-center gap-4 rounded-xl px-2 py-4 outline-none focus-visible:ring-2"
          >
            <span className="bg-brand-wash text-brand-text grid size-11 shrink-0 place-items-center rounded-full">
              <Pin className="size-5" aria-hidden />
            </span>
            <span className="grid min-w-0 flex-1">
              <span className="truncate text-[15px] font-semibold">{aviso.titulo}</span>
              <span className="text-muted-foreground mt-0.5 truncate text-[13px]">
                {aviso.autor ? `${aviso.autor} · ` : ''}
                {formatarDataRelativa(aviso.publicado_em)}
              </span>
            </span>
            <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
          </LinkDaPagina>
        </li>
      ))}
    </ul>
  )
}
