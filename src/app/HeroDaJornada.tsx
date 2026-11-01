import cena from '@/assets/3d/cena-colacao-auditorio-lateral-creme.png'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { ROTAS } from '@/config/rotas'
import { formatarData, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { FormaturaDetalhe } from '@/types/formatura'

/**
 * A saudação, a contagem regressiva e a cena da colação, no topo do Início.
 *
 * A contagem fica no centro, com o número grande, o traço à mão embaixo e a data — o desenho que a
 * tela já usava, agora entre a saudação e a cena. A imagem ocupa a direita no tamanho natural: o hero
 * cresce em altura para ela não ser cortada nem ampliada. Sem mascote.
 *
 * @param turma A formatura da sessão, da qual saem o nome e o curso.
 * @param primeiroNome Como chamar quem abriu o app.
 * @param dias Quantos dias faltam — negativo já passou, nulo sem data marcada.
 * @param evento "a festa" ou "a colação": o que a contagem conta.
 * @param fim A data contada, ou nula.
 * @param ehGestao Se quem olha pode marcar a data — muda só o convite do vazio.
 */
export function HeroDaJornada({
  turma,
  primeiroNome,
  dias,
  evento,
  fim,
  ehGestao,
}: {
  turma: FormaturaDetalhe
  primeiroNome: string
  dias: number | null
  evento: string
  fim: string | null
  ehGestao: boolean
}) {
  const contando = dias !== null && dias > 0

  return (
    <section
      aria-label="Sua jornada até a formatura"
      className="relative isolate grid items-center gap-7 rounded-3xl px-5 py-7 sm:px-8 sm:py-9 lg:min-h-[460px] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-6 lg:px-10 lg:py-10"
    >
      <div className="min-w-0">
        <h2
          className={cn(
            'leading-tight font-semibold tracking-tight break-words',
            // Nome longo desce um tamanho, e só quebra no meio se nem assim couber.
            primeiroNome.length > 10 ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl',
          )}
        >
          Olá, {primeiroNome} <span className="text-brand">:)</span>
        </h2>
        <p className="text-muted-foreground mt-3 max-w-md text-base leading-relaxed sm:text-lg">
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
        <p className="mt-5 text-base font-semibold break-words sm:text-lg">{turma.nome}</p>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {[turma.curso, turma.instituicao].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="grid justify-items-center self-center text-center">
        {contando ? (
          <>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase sm:text-sm">
              Contagem regressiva
            </p>
            <p className="text-brand mt-2 text-7xl leading-none font-extrabold tracking-tighter tabular-nums sm:text-8xl">
              {formatarNumero(dias)}
            </p>
            <svg
              viewBox="0 0 210 18"
              preserveAspectRatio="none"
              aria-hidden
              className="text-brand/50 pointer-events-none mt-1 h-3 w-36 sm:w-44"
            >
              <path
                d="M3 13Q98 1 207 10M20 17Q112 7 188 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <p className="mt-2 text-base sm:text-lg">
              {dias === 1 ? 'dia' : 'dias'} para {evento}
            </p>
            {fim ? (
              <p className="text-muted-foreground mt-4 text-sm tabular-nums">{formatarData(fim)}</p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase sm:text-sm">
              O grande dia
            </p>
            <p className="text-brand-text mt-2 text-2xl font-semibold">
              {dias === null ? 'Vem aí!' : dias === 0 ? 'É hoje!' : 'Fica na memória'}
            </p>
            <p className="text-muted-foreground mt-1 max-w-48 text-sm">
              {dias === null
                ? 'A data ainda será marcada.'
                : dias === 0
                  ? `Chegou o dia d${evento}.`
                  : `${turma.previsao_da_festa ? 'A festa' : 'A colação'} foi ${dias === -1 ? 'ontem' : `há ${formatarNumero(Math.abs(dias))} dias`}.`}
            </p>
            {fim ? (
              <p className="text-muted-foreground mt-3 text-sm tabular-nums">{formatarData(fim)}</p>
            ) : ehGestao ? (
              <LinkDaPagina to={ROTAS.agenda} className="text-brand-text mt-3 text-sm font-semibold">
                Marcar agora
              </LinkDaPagina>
            ) : null}
          </>
        )}
      </div>

      <div className="relative h-52 overflow-hidden rounded-2xl sm:h-60 lg:absolute lg:inset-y-0 lg:right-0 lg:h-full lg:w-[36%] lg:rounded-l-none lg:rounded-r-3xl">
        <img src={cena} alt="" className="size-full object-cover object-[78%_100%]" />
        {/* A cena entra na página pelo canto esquerdo, sem moldura visível. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden [background:linear-gradient(90deg,#f7f6f3_0%,rgba(247,246,243,.85)_12%,rgba(247,246,243,.25)_30%,transparent_48%)] lg:block"
        />
        <p className="font-hand text-brand-text absolute right-4 bottom-4 -rotate-3 rounded-md bg-white/75 px-2 py-0.5 text-2xl leading-none">
          Juntos até a formatura!
        </p>
      </div>
    </section>
  )
}
