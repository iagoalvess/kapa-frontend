import { CalendarDays } from 'lucide-react'
import { Link } from 'react-router'
import mascoteAcenando from '@/assets/mascote/acenando.webp'
import mascoteCanudo from '@/assets/mascote/canudo.webp'
import mascoteFoguete from '@/assets/mascote/foguete.webp'
import { Esqueleto, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { ICONE_DO_TIPO } from '@/features/agenda'
import { useResumoDaAgenda } from '@/hooks/useAgenda'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { usePapel, useSessao } from '@/hooks/useSessao'
import { diasAte, formatarData, formatarNumero } from '@/lib/formato'
import { CartaoDaFesta } from './CartaoDaFesta'
import { CartaoDaProximaParcela } from './CartaoDaProximaParcela'
import { CartaoDoMural } from './CartaoDoMural'
import { CartaoDosDocumentos } from './CartaoDosDocumentos'

/** A página conecta a jornada coletiva às próximas ações da pessoa. */
export function PaginaInicial() {
  const { usuario } = useSessao()
  const { tem } = usePapel()
  const formatura = useFormaturaAtual()
  const ehGestao = tem(PAPEIS.tesoureiro, PAPEIS.comissao)

  if (formatura.isPending) return <Esqueleto className="h-80 rounded-3xl" />
  if (formatura.isError) return <ErroDaConsulta erro={formatura.error} />

  const turma = formatura.data
  const fim = turma.previsao_da_festa ?? turma.previsao_de_colacao
  const dias = diasAte(fim)
  const evento = turma.previsao_da_festa ? 'a festa' : 'a colação'
  const mascote = dias === null ? mascoteAcenando : dias > 30 ? mascoteFoguete : mascoteCanudo
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'visitante'

  return (
    <div className="grid gap-5">
      <section
        aria-label="Sua jornada até a formatura"
        className="bg-card shadow-cartao overflow-hidden rounded-3xl"
      >
        <div className="relative grid items-center gap-5 p-5 lg:grid-cols-[1.15fr_1fr]">
          <div className="relative z-10 min-w-0">
            <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              Olá, {primeiroNome} <span className="text-brand-text">:)</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md text-base leading-relaxed">
              Uma grande conquista se faz juntos.
              <br className="hidden sm:block" /> Vamos dar o{' '}
              <span className="relative inline-block">
                próximo passo?
                <svg
                  aria-hidden
                  viewBox="0 0 160 12"
                  fill="none"
                  className="text-brand/55 pointer-events-none absolute -bottom-1.5 left-0 h-3 w-full"
                >
                  <path
                    d="M3 8C43 2 105 2 156 6M20 11C63 6 110 7 143 9"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </p>
            <p className="mt-5 text-sm font-medium break-words">{turma.nome}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {[turma.curso, turma.instituicao].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="relative flex min-w-0 items-center justify-center gap-2 py-3 sm:gap-4">
            <div aria-hidden className="bg-background absolute size-56 rounded-full" />
            <div className="bg-card shadow-cartao relative z-10 -rotate-3 rounded-2xl border border-white px-5 py-5 text-center sm:px-7">
              <p className="text-muted-foreground text-xs font-medium">
                {dias !== null && dias > 0 ? 'Contagem regressiva' : 'O grande dia'}
              </p>
              {dias !== null && dias > 0 ? (
                <>
                  <p className="text-brand-text my-2 text-5xl font-semibold tracking-tighter tabular-nums sm:text-6xl">
                    {formatarNumero(dias)}
                  </p>
                  <p className="text-sm">
                    {dias === 1 ? 'dia' : 'dias'} para {evento}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-brand-text mt-3 text-2xl font-semibold">
                    {dias === null ? 'Vem aí!' : dias === 0 ? 'É hoje!' : 'Fica na memória'}
                  </p>
                  <p className="text-muted-foreground mt-2 max-w-44 text-sm">
                    {dias === null
                      ? 'A data ainda será marcada.'
                      : dias === 0
                        ? `Chegou o dia d${evento}.`
                        : `${turma.previsao_da_festa ? 'A festa' : 'A colação'} foi ${dias === -1 ? 'ontem' : `há ${formatarNumero(Math.abs(dias))} dias`}.`}
                  </p>
                </>
              )}
              {fim ? (
                <p className="border-border text-muted-foreground mt-3 border-t pt-3 text-xs">
                  {formatarData(fim)}
                </p>
              ) : ehGestao ? (
                <Link
                  to={ROTAS.agenda}
                  className="text-brand-text mt-3 inline-block text-sm underline underline-offset-4"
                >
                  Marcar agora
                </Link>
              ) : null}
            </div>
            <div className="relative grid w-20 shrink-0 justify-items-center min-[400px]:w-28 sm:w-44 xl:w-52">
              <img src={mascote} alt="" className="w-full object-contain drop-shadow-lg" />
              <p className="font-hand text-brand-text mt-2 -rotate-6 text-center text-lg leading-none sm:text-2xl">
                Juntos até a<br />
                formatura!
              </p>
              <svg
                aria-hidden
                viewBox="0 0 32 28"
                fill="none"
                className="text-brand/70 pointer-events-none mt-2 h-5 w-6 rotate-6"
              >
                <path
                  d="M16 23S3 15 5 8C7 2 13 5 16 9C19 3 26 3 27 9C29 16 16 23 16 23Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
        <ProximasDatas ehGestao={ehGestao} />
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="order-2 grid min-w-0 gap-5 xl:order-1">
          <CartaoDaFesta />
          <CartaoDoMural />
        </div>
        <div className="order-1 grid min-w-0 gap-5 xl:order-2">
          <CartaoDaProximaParcela />
          <CartaoDosDocumentos />
        </div>
      </div>
    </div>
  )
}

/**
 * As três próximas datas da turma, direto da agenda.
 *
 * Eram três marcos fixos — começo, colação e festa —, e viraram isto na Sprint 19: quando a turma
 * tem reunião amanhã e prova da beca semana que vem, dizer só "colação em 2027" é responder o que
 * ninguém perguntou. A colação e a festa continuam no contador ao lado, que é onde elas pesam.
 *
 * O resumo é um endpoint próprio: a home desenha três linhas e não deve carregar a agenda inteira
 * a cada abertura do app.
 *
 * @param ehGestao Se quem está olhando pode marcar data — muda só o convite do vazio.
 */
function ProximasDatas({ ehGestao }: { ehGestao: boolean }) {
  const resumo = useResumoDaAgenda()
  const proximos = resumo.data?.proximos ?? []
  const restantes = (resumo.data?.total ?? 0) - proximos.length

  return (
    <div className="border-border border-t p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Próximas datas</h3>
        <Link
          to={ROTAS.agenda}
          className="text-brand-text text-xs font-medium underline-offset-4 hover:underline"
        >
          Ver agenda
        </Link>
      </div>

      {resumo.isPending ? <EsqueletoDeTexto linhas={2} /> : null}

      {resumo.data && proximos.length === 0 ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <CalendarDays className="size-4 shrink-0" aria-hidden />
          {ehGestao
            ? 'Nenhuma data marcada. Comece pela colação e pela festa, na Agenda.'
            : 'A comissão ainda não marcou nenhuma data.'}
        </p>
      ) : null}

      {proximos.length > 0 ? (
        <ol aria-label="Próximas datas da turma" className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {proximos.map((evento) => {
            const Icone = ICONE_DO_TIPO[evento.tipo]
            const dias = diasAte(evento.data)

            return (
              <li key={evento.id} className="flex min-w-0 items-center gap-3">
                <span className="border-brand-tint bg-card text-brand-text grid size-10 shrink-0 place-items-center rounded-full border">
                  <Icone className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{evento.titulo}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    <time dateTime={evento.data}>{formatarData(evento.data)}</time>
                    {dias !== null && dias >= 0
                      ? ` · ${dias === 0 ? 'é hoje' : dias === 1 ? 'amanhã' : `em ${formatarNumero(dias)} dias`}`
                      : null}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      ) : null}

      {restantes > 0 ? (
        <p className="text-muted-foreground mt-4 text-xs">
          e mais {formatarNumero(restantes)} {restantes === 1 ? 'data marcada' : 'datas marcadas'}.
        </p>
      ) : null}
    </div>
  )
}
