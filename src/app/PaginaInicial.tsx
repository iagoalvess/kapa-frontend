import { ArrowRight } from 'lucide-react'
import { EsqueletoDeCartao } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { MODULOS } from '@/config/planos'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'
import { usePapel, useSessao } from '@/hooks/useSessao'
import { diasAte } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { AvisoDeCadastro } from './AvisoDeCadastro'
import { AvisoDeAdesao } from './AvisoDeAdesao'
import { BlocoDaFesta } from './BlocoDaFesta'
import { BlocoDaParcela } from './BlocoDaParcela'
import { FeedDoMural } from './FeedDoMural'
import { GraficoDaArrecadacao } from './GraficoDaArrecadacao'
import { HeroDaJornada } from './HeroDaJornada'
import { PrimeirosPassos } from './PrimeirosPassos'
import { ProximasDatas } from './ProximasDatas'
import { Rotulo } from './RotuloDoBloco'

/**
 * O Início: a página conecta a jornada coletiva às próximas ações da pessoa, numa leitura só — o herói
 * com a contagem, a parcela da pessoa, o dinheiro da turma, a evolução e os recados, separados por fios
 * em vez de uma grade de cartões iguais.
 */
export function PaginaInicial() {
  const { usuario } = useSessao()
  const { tem } = usePapel()
  const formatura = useFormaturaAtual()
  const ehGestao = tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const temMural = usePlanoDaTurma().inclui(MODULOS.mural)

  if (formatura.isPending) return <EsqueletoDeCartao className="h-80 overflow-hidden" />
  if (formatura.isError) return <ErroDaConsulta erro={formatura.error} />

  const turma = formatura.data
  const fim = turma.previsao_da_festa ?? turma.previsao_de_colacao
  const dias = diasAte(fim)
  const evento = turma.previsao_da_festa ? 'a festa' : 'a colação'
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'visitante'

  // O Início apresenta só o que a turma pode usar. Esperar o plano também evita que os blocos
  // exclusivos apareçam por um instante antes de a consulta terminar.
  const temDinheiro = temMural
  const temRecados = temMural

  return (
    <div className="grid">
      <HeroDaJornada
        turma={turma}
        primeiroNome={primeiroNome}
        dias={dias}
        evento={evento}
        fim={fim}
        ehGestao={ehGestao}
      />

      <AvisoDeCadastro />
      <AvisoDeAdesao />
      {tem(PAPEIS.tesoureiro) ? <PrimeirosPassos turma={turma} /> : null}

      <svg
        aria-hidden
        viewBox="0 0 1000 28"
        preserveAspectRatio="none"
        className="text-brand/45 mx-auto hidden h-5 w-full lg:block"
      >
        <path
          d="M8 8C205 5 379 8 485 8C492 8 496 21 500 21C504 21 508 8 515 8C621 8 795 5 992 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M430 13Q466 10 492 15M508 15Q534 10 570 13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.65"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className={cn('grid border-b', temDinheiro && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.16fr)]')}>
        <section
          aria-labelledby="bloco-parcela"
          className={cn('grid min-w-0 content-start gap-4 pt-8 pb-9', temDinheiro && 'lg:pr-12')}
        >
          <Rotulo id="bloco-parcela">Sua parcela</Rotulo>
          <BlocoDaParcela />
        </section>

        {temDinheiro ? (
          <section
            aria-labelledby="bloco-dinheiro"
            className="grid min-w-0 content-start gap-4 border-t pt-8 pb-9 lg:border-t-0 lg:border-l lg:pl-12"
          >
            <Rotulo id="bloco-dinheiro">O dinheiro da turma</Rotulo>
            <BlocoDaFesta />
          </section>
        ) : null}
      </div>

      <GraficoDaArrecadacao />

      <div className={cn('grid', temRecados && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.16fr)]')}>
        <section
          aria-labelledby="bloco-datas"
          className={cn('grid min-w-0 content-start gap-4 pt-8', temRecados && 'lg:pr-12')}
        >
          <Cabecalho id="bloco-datas" rotulo="Próximas datas" para={ROTAS.agenda} texto="Ver agenda" />
          <ProximasDatas ehGestao={ehGestao} />
        </section>

        {temRecados ? (
          <section
            aria-labelledby="bloco-recados"
            className="grid min-w-0 content-start gap-4 border-t pt-8 lg:border-t-0 lg:border-l lg:pl-12"
          >
            <Cabecalho id="bloco-recados" rotulo="Recados" para={ROTAS.mural} texto="Ver o mural" />
            <FeedDoMural />
          </section>
        ) : null}
      </div>
    </div>
  )
}

/** O rótulo do bloco com o atalho para a tela do assunto. */
function Cabecalho({ id, rotulo, para, texto }: { id: string; rotulo: string; para: string; texto: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Rotulo id={id}>{rotulo}</Rotulo>
      <LinkDaPagina to={para} className="text-brand-text inline-flex items-center gap-1.5 text-sm font-bold">
        {texto}
        <ArrowRight className="size-4" aria-hidden />
      </LinkDaPagina>
    </div>
  )
}
