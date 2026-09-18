import { Fragment } from 'react'
import { Link } from 'react-router'
import mascoteAcenando from '@/assets/mascote/acenando.webp'
import mascoteCanudo from '@/assets/mascote/canudo.webp'
import mascoteFoguete from '@/assets/mascote/foguete.webp'
import { Esqueleto } from '@/components/Esqueleto'
import { BarraDaMeta } from './BarraDaMeta'
import { CartaoDaProximaParcela } from './CartaoDaProximaParcela'
import { CartaoDoMural } from './CartaoDoMural'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { usePapel, useSessao } from '@/hooks/useSessao'
import { diasAte, formatarData, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { FormaturaDetalhe } from '@/types/formatura'

/** Uma estação da jornada: o que é e quando é — nula na data que a comissão ainda não marcou. */
interface Marco {
  rotulo: string
  dia: string | null
}

/** Meia-noite local: a conta de dias não pode depender da hora em que a tela abriu. */
const emDias = (dia: string) => new Date(`${dia}T00:00:00`).getTime()

/** A data que fecha a jornada: a festa; sem ela, a colação. */
const fimDaJornada = (turma: FormaturaDetalhe) => turma.previsao_da_festa ?? turma.previsao_de_colacao

/**
 * O mascote da vez: o foguete enquanto há caminho, o canudo no último mês e depois dele.
 *
 * Acenando é o sem-data: a turma existe, o calendário ainda não — e é a única situação em que o
 * cartão não tem o que contar.
 */
const mascoteDe = (dias: number | null) =>
  dias === null ? mascoteAcenando : dias > 30 ? mascoteFoguete : mascoteCanudo

/**
 * A frase da contagem.
 *
 * Singular, plural e "é hoje": "faltam 1 dias para a festa" é o tipo de descuido que aparece
 * justamente no dia mais importante da turma.
 */
function contagem(dias: number, festa: boolean) {
  const evento = festa ? 'a festa' : 'a colação de grau'
  const passado = festa ? 'A festa' : 'A colação'

  if (dias === 0) return `É hoje: ${evento} é hoje.`
  if (dias === 1) return `Falta 1 dia para ${evento}.`
  if (dias > 1) return `Faltam ${formatarNumero(dias)} dias para ${evento}.`
  if (dias === -1) return `${passado} foi ontem.`

  return `${passado} foi há ${formatarNumero(Math.abs(dias))} dias.`
}

/** Se o marco já aconteceu. Fora do componente, como {@link trecho}: quem lê o relógio é o módulo. */
const jaPassou = (dia: string | null) => dia !== null && emDias(dia) <= Date.now()

/**
 * Quanto do trecho entre dois marcos já passou, de 0 a 100.
 *
 * Trecho sem data nas duas pontas fica vazio: o caminho até uma data que a comissão não marcou é
 * desconhecido, e desenhá-lo cheio ou vazio pela metade seria inventar.
 */
function trecho(de: string | null, ate: string | null) {
  if (!de || !ate) return 0

  const largura = emDias(ate) - emDias(de)
  if (largura <= 0) return 100

  return Math.min(100, Math.max(0, ((Date.now() - emDias(de)) / largura) * 100))
}

/**
 * A jornada da turma como estações: criada, colação, festa.
 *
 * **Espaçadas por igual, e não pelo calendário.** Colação e festa costumam cair no mesmo fim de
 * semana, a anos do começo: numa régua proporcional as duas viram um ponto só na quina direita, e a
 * barra inteira fica sem dizer nada. Assim cada estação tem o mesmo peso, e o que enche o trecho é
 * o tempo que já passou dentro dele.
 *
 * O rótulo de cada uma fica embaixo do próprio ponto — é por isso que as estações são três, e não
 * uma lista que cresce: com quatro ou mais, os rótulos se encavalam no celular.
 */
function Jornada({ marcos }: { marcos: Marco[] }) {
  return (
    <div className="grid gap-2.5">
      <div className="flex items-center gap-2">
        {marcos.map((marco, indice) => (
          <Fragment key={marco.rotulo}>
            {indice > 0 ? (
              <span className="bg-border h-1.5 flex-1 overflow-hidden rounded-full">
                <span
                  className="bg-brand block h-full rounded-full"
                  style={{ width: `${trecho(marcos[indice - 1]?.dia ?? null, marco.dia)}%` }}
                />
              </span>
            ) : null}
            <span
              className={cn('size-3.5 shrink-0 rounded-full', jaPassou(marco.dia) ? 'bg-brand' : 'bg-border')}
            />
          </Fragment>
        ))}
      </div>

      {/* `justify-between` casa com os pontos porque as estações são igualmente espaçadas: o
          primeiro rótulo alinha à esquerda, o último à direita e o do meio fica centrado. */}
      <dl className="flex justify-between gap-4 text-xs">
        {marcos.map((marco, indice) => (
          <div
            key={marco.rotulo}
            className={cn(
              'grid gap-0.5',
              indice === 0 && 'text-left',
              indice === marcos.length - 1 && 'text-right',
              indice > 0 && indice < marcos.length - 1 && 'text-center',
            )}
          >
            <dt className="text-muted-foreground">{marco.rotulo}</dt>
            <dd className="text-texto-muted tabular-nums">
              {marco.dia ? formatarData(marco.dia) : 'a marcar'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * Primeira tela depois do login: a saudação e onde a turma está no caminho até a festa.
 *
 * **Uma coisa só, e uma que nenhuma outra tela responde.** Os três avisos que moravam aqui saíram em
 * 16/09/2026 porque cada pendência passou a marcar a porta em que se resolve — o ponto no item "Meu
 * termo", o número em "Conferir", o ponto no avatar. Repetir aqui os números do caixa, as parcelas
 * ou o mural traria o mesmo problema com outra roupa: quatro telas dizendo a mesma coisa, e a home
 * sendo a pior das quatro.
 *
 * O que sobra é o "quanto falta" — as datas da colação e da festa já estão no cadastro da turma, e
 * até aqui só apareciam dentro de um formulário.
 */
export function PaginaInicial() {
  const { usuario } = useSessao()
  const { tem } = usePapel()
  const formatura = useFormaturaAtual()

  const primeiroNome = usuario?.nome?.split(' ')[0] || 'visitante'

  if (formatura.isPending) return <Esqueleto className="h-48 rounded-3xl" />

  const turma = formatura.data
  const fim = turma ? fimDaJornada(turma) : null
  const dias = diasAte(fim)
  const semData = turma !== undefined && fim === null
  const ehGestao = tem(PAPEIS.tesoureiro, PAPEIS.comissao)

  return (
    <div className="grid gap-5">
      <section className="bg-card shadow-faixa grid gap-7 rounded-3xl px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <img src={mascoteDe(dias)} alt="" className="size-20 shrink-0 drop-shadow-lg sm:size-24" />

          <div className="grid min-w-0 flex-1 gap-1">
            <h2 className="text-foreground text-xl font-medium tracking-tight sm:text-2xl">
              Olá, {primeiroNome}
            </h2>
            {/* A turma, e não a contagem: o número à direita já a dá, e o cabeçalho deixou de mostrar
              em que turma você está quando o seletor foi para o menu do avatar. */}
            <p className="text-muted-foreground text-[15px]">{turma ? descrever(turma) : ''}</p>

            {semData ? (
              <p className="text-texto-muted text-sm">
                Colação e festa ainda sem data.{' '}
                {ehGestao ? (
                  <Link to={ROTAS.formatura} className="text-brand-text underline underline-offset-4">
                    Marcar agora
                  </Link>
                ) : null}
              </p>
            ) : null}
            {/* Passada a festa, a frase toma o lugar do número — contar dias para trás não é o que
              esta tela existe para fazer. */}
            {dias !== null && dias <= 0 ? (
              <p className="text-texto-muted text-sm">{contagem(dias, turma?.previsao_da_festa !== null)}</p>
            ) : null}
          </div>

          {/* O número grande é a única coisa que a pessoa quer saber de longe. Some depois da festa:
            contar dias para trás não é o que esta tela existe para fazer. */}
          {dias !== null && dias > 0 ? (
            <p className="grid w-full justify-items-start text-left sm:w-auto sm:justify-items-end sm:text-right">
              <span className="text-foreground text-4xl leading-none font-medium tracking-tight tabular-nums sm:text-5xl">
                {formatarNumero(dias)}
              </span>
              <span className="text-muted-foreground text-sm">
                {dias === 1 ? 'dia' : 'dias'} para {turma?.previsao_da_festa ? 'a festa' : 'a colação'}
              </span>
            </p>
          ) : null}
        </div>

        {turma ? <Jornada marcos={marcosDaTurma(turma)} /> : null}

        {/* O "quanto falta" na outra moeda: a jornada conta dias, a barra conta dinheiro. */}
        <BarraDaMeta />
      </section>

      {/* Duas colunas, como em Privacidade: à esquerda o que é da turma, à direita o que é da
          pessoa. Nenhuma das duas repete uma tela inteira — o mural entra só com os fixados, e as
          parcelas, só com a próxima. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <CartaoDoMural />
        <CartaoDaProximaParcela />
      </div>
    </div>
  )
}

/** As três estações, na ordem do tempo. O começo é a ativação — antes dela a turma é rascunho. */
function marcosDaTurma(turma: FormaturaDetalhe): Marco[] {
  return [
    { rotulo: 'Turma criada', dia: (turma.ativada_em ?? turma.criado_em).slice(0, 10) },
    { rotulo: 'Colação', dia: turma.previsao_de_colacao },
    { rotulo: 'Festa', dia: turma.previsao_da_festa },
  ]
}

/** "Odontologia 2027.2 · UFPR": a turma como a pessoa a reconhece, sem repetir o nome livre dela. */
function descrever(turma: FormaturaDetalhe) {
  const periodo = turma.ano ? [turma.ano, turma.semestre || null].filter(Boolean).join('.') : ''

  return [[turma.curso, periodo].filter(Boolean).join(' '), turma.instituicao].filter(Boolean).join(' · ')
}
