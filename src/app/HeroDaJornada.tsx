import mascoteAcenando from '@/assets/mascote/acenando.webp'
import mascoteCanudo from '@/assets/mascote/canudo.webp'
import mascoteFoguete from '@/assets/mascote/foguete.webp'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { ROTAS } from '@/config/rotas'
import { formatarData, formatarNumero } from '@/lib/formato'
import type { FormaturaDetalhe } from '@/types/formatura'

/**
 * A saudação e a contagem regressiva, no topo do Início — sem caixa: é a leitura que abre a tela.
 *
 * O mascote troca com a distância do grande dia (longe, perto, sem data), e a data de hoje vira um
 * convite para marcar quando a turma ainda não tem nenhuma.
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
  const mascote = dias === null ? mascoteAcenando : dias > 30 ? mascoteFoguete : mascoteCanudo

  return (
    <section
      aria-label="Sua jornada até a formatura"
      className="relative grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,1fr)_minmax(0,1fr)] lg:gap-5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 hidden h-[420px] w-[660px] lg:block"
        style={{ background: 'radial-gradient(closest-side, var(--brand-wash), transparent 72%)' }}
      />

      <div className="min-w-0 pt-7 pb-8 lg:col-start-1 lg:row-start-1 lg:self-center lg:pr-4">
        <h2 className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
          Olá, {primeiroNome} <span className="text-brand">:)</span>
        </h2>
        <p className="text-muted-foreground mt-3 max-w-lg text-lg leading-relaxed sm:text-xl">
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

      <div className="flex min-w-0 items-center justify-between gap-6 pt-2 pb-8 lg:contents">
        <div className="grid justify-items-center text-center lg:col-start-2 lg:row-start-1 lg:justify-self-center lg:py-8">
          <p className="text-muted-foreground text-sm font-medium">
            {dias !== null && dias > 0 ? 'Contagem regressiva' : 'O grande dia'}
          </p>

          {dias !== null && dias > 0 ? (
            <>
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
            <p className="text-muted-foreground mt-5 text-sm tabular-nums">{formatarData(fim)}</p>
          ) : ehGestao ? (
            <LinkDaPagina
              to={ROTAS.agenda}
              className="text-brand-text mt-3 text-sm underline underline-offset-4"
            >
              Marcar agora
            </LinkDaPagina>
          ) : null}
        </div>

        <div className="relative flex shrink-0 items-center lg:col-start-3 lg:row-start-1 lg:justify-self-end">
          <img
            src={mascote}
            alt=""
            className="w-24 object-contain drop-shadow-lg sm:w-32 lg:w-40"
            loading="lazy"
          />
          <p className="font-hand text-brand-text hidden -rotate-6 text-center text-2xl leading-none sm:block">
            Juntos até a
            <br />
            formatura!
          </p>
        </div>
      </div>
    </section>
  )
}
