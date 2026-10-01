import { ChevronRight, Megaphone, Pin } from 'lucide-react'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { ROTAS, rotaDoAviso } from '@/config/rotas'
import { useAvisos } from '@/features/comunicacao'
import { formatarDataRelativa } from '@/lib/formato'

/** Quantos fixados cabem sem a home virar uma segunda tela de mural. */
const QUANTOS = 3

/**
 * Os avisos fixados do mural, no Início.
 *
 * **Fixados, e não os mais recentes**: fixar é o gesto com que a comissão diz "isto todo mundo tem
 * de ver" — é a única lista do mural que faz sentido repetir fora dele. O sino ao lado cuida do que
 * é novo para cada pessoa; aqui é o que vale para a turma inteira, tenha sido lido ou não.
 *
 * As linhas têm o desenho das "Próximas datas" do cartão de cima — ícone em círculo, título, quem e
 * quando, e a seta: são duas listas do mesmo tipo na mesma tela. Cada linha abre o seu aviso; a
 * seta do cabeçalho leva ao mural.
 */
export function CartaoDoMural() {
  const avisos = useAvisos({ fixado: true, pagina: 1, tamanho: QUANTOS })
  const itens = avisos.data?.itens ?? []

  return (
    <Cartao
      titulo="Recados para a turma"
      icone={Megaphone}
      para={ROTAS.mural}
      rotuloDoAtalho="Ver o mural"
      className="gap-3"
    >
      {avisos.isError ? <ErroDaConsulta erro={avisos.error} /> : null}
      {avisos.isPending ? <EsqueletoDeTexto linhas={3} /> : null}

      {avisos.data && itens.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          A comissão ainda não fixou nenhum aviso. Os avisos do dia a dia continuam no mural.
        </p>
      ) : null}

      {itens.length > 0 ? (
        <ol aria-label="Avisos fixados" className="grid">
          {itens.map((aviso) => (
            <li key={aviso.id} className="border-border border-b last:border-0">
              <LinkDaPagina
                to={rotaDoAviso(aviso.id)}
                className="hover:bg-muted/60 focus-visible:ring-ring -mx-2 flex min-w-0 items-center gap-3 rounded-xl px-2 py-2.5 outline-none focus-visible:ring-2"
              >
                <span className="bg-brand-tint text-brand-text grid size-10 shrink-0 place-items-center rounded-full">
                  <Pin className="size-4" aria-hidden />
                </span>
                <span className="grid min-w-0 flex-1">
                  <span className="truncate text-sm font-medium">{aviso.titulo}</span>
                  <span className="text-muted-foreground mt-0.5 truncate text-xs">
                    {aviso.autor ? `${aviso.autor} · ` : ''}
                    {formatarDataRelativa(aviso.publicado_em)}
                  </span>
                </span>
                <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
              </LinkDaPagina>
            </li>
          ))}
        </ol>
      ) : null}
    </Cartao>
  )
}
