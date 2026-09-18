import { Megaphone } from 'lucide-react'
import { Link } from 'react-router'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
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
 */
export function CartaoDoMural() {
  const avisos = useAvisos({ fixado: true, pagina: 1, tamanho: QUANTOS })
  const itens = avisos.data?.itens ?? []

  return (
    <Cartao
      titulo="No mural"
      icone={Megaphone}
      descricao="O que a comissão deixou fixado para a turma."
      acao={
        <Link
          to={ROTAS.mural}
          className="text-brand-text text-sm underline underline-offset-4 hover:opacity-85"
        >
          Ver o mural
        </Link>
      }
    >
      {avisos.isPending ? <EsqueletoDeTexto linhas={3} /> : null}

      {avisos.data && itens.length === 0 ? (
        <p className="text-muted-foreground text-[15px]">
          A comissão ainda não fixou nenhum aviso. Os avisos do dia a dia continuam no mural.
        </p>
      ) : null}

      {itens.length > 0 ? (
        <ul className="grid gap-4 text-[15px]">
          {itens.map((aviso) => (
            <li key={aviso.id} className="border-border grid gap-1 border-b pb-4 last:border-0 last:pb-0">
              <Link
                to={rotaDoAviso(aviso.id)}
                className="text-foreground focus-visible:ring-ring w-fit rounded font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
              >
                {aviso.titulo}
              </Link>
              <span className="text-texto-muted text-sm">
                {aviso.autor ? `${aviso.autor} · ` : ''}
                {formatarDataRelativa(aviso.publicado_em)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Cartao>
  )
}
