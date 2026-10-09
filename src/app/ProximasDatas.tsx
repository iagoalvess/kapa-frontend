import { ChevronRight } from 'lucide-react'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { ROTAS } from '@/config/rotas'
import { useResumoDaAgenda } from '@/hooks/useAgenda'
import { diasAte, formatarData, formatarMesDoDia, formatarNumero } from '@/lib/formato'

/**
 * As três próximas datas da turma, direto da agenda — em lista, com o dia num bloco.
 *
 * Eram três marcos fixos — começo, colação e festa —, e viraram isto na Sprint 19: quando a turma tem
 * reunião amanhã e prova da beca semana que vem, dizer só "colação em 2027" é responder o que ninguém
 * perguntou. A colação e a festa continuam no contador ao lado, que é onde elas pesam.
 *
 * O resumo é um endpoint próprio: o Início desenha três linhas e não carrega a agenda inteira a cada
 * abertura do app. Sem data marcada, o Início não desenha o bloco.
 */
export function ProximasDatas() {
  const resumo = useResumoDaAgenda()
  const proximos = resumo.data?.proximos ?? []

  if (resumo.isPending) return <EsqueletoDeTexto linhas={3} />
  if (resumo.isError)
    return <ErroDaConsulta compacto erro={resumo.error} aoTentarDeNovo={() => void resumo.refetch()} />

  return (
    <ol aria-label="Próximas datas da turma" className="grid">
      {proximos.map((evento) => {
        const dias = diasAte(evento.data)
        const data = formatarData(evento.data)

        return (
          <li key={evento.id} className="border-border border-b last:border-0">
            {/* A linha inteira leva à agenda: a data não tem tela própria, e é lá que ela se lê inteira. */}
            <LinkDaPagina
              to={ROTAS.agenda}
              className="hover:bg-muted/60 focus-visible:ring-ring -mx-2 flex min-w-0 items-center gap-4 rounded-xl px-2 py-4 outline-none focus-visible:ring-2"
            >
              <span className="bg-brand-wash grid size-11 shrink-0 place-content-center gap-0.5 rounded-xl text-center">
                <span className="text-base leading-none font-extrabold tabular-nums">{data.slice(0, 2)}</span>
                <span className="text-texto-muted text-[10px] font-bold tracking-[.06em] uppercase">
                  {formatarMesDoDia(evento.data)}
                </span>
              </span>

              <span className="grid min-w-0 flex-1">
                <span className="truncate text-[15px] font-semibold">{evento.titulo}</span>
                <span className="text-muted-foreground mt-0.5 text-[13px]">
                  {data}
                  {dias !== null && dias >= 0
                    ? ` · ${dias === 0 ? 'é hoje' : dias === 1 ? 'amanhã' : `em ${formatarNumero(dias)} dias`}`
                    : null}
                </span>
              </span>

              <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
            </LinkDaPagina>
          </li>
        )
      })}
    </ol>
  )
}
