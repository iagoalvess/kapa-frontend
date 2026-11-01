import { ArrowRight } from 'lucide-react'
import { Fragment } from 'react'
import { EsqueletoDeCartao } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { MODULOS } from '@/config/planos'
import { PAPEIS } from '@/config/perfis'
import { rotaDoPagamento, ROTAS } from '@/config/rotas'
import { useProximasParcelas } from '@/features/pagamentos'
import { useResumoDaAgenda } from '@/hooks/useAgenda'
import { enqueteDaHome, useEnquetes } from '@/hooks/useEnquetes'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'
import { usePapel, useSessao } from '@/hooks/useSessao'
import { diasAte } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { AvisoDeCadastro } from './AvisoDeCadastro'
import { AvisoDeAdesao } from './AvisoDeAdesao'
import { BlocoDasEnquetes } from './BlocoDasEnquetes'
import { BlocoDaParcela } from './BlocoDaParcela'
import { FeedDoMural, useAvisosFixados } from './FeedDoMural'
import { HeroDaJornada } from './HeroDaJornada'
import { PrimeirosPassos } from './PrimeirosPassos'
import { ProximasDatas } from './ProximasDatas'
import { Rotulo } from './RotuloDoBloco'
import { TracoDoInicio } from './TracoDoInicio'

/**
 * O Início: a página conecta a jornada coletiva às próximas ações da pessoa, numa leitura só — o herói
 * com a contagem, a parcela da pessoa, a enquete da turma, a evolução e os recados, separados por fios
 * em vez de uma grade de cartões iguais.
 */
export function PaginaInicial() {
  const { usuario } = useSessao()
  const { tem } = usePapel()
  const formatura = useFormaturaAtual()
  const ehGestao = tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const temMural = usePlanoDaTurma().inclui(MODULOS.mural)
  const incluiEnquetes = usePlanoDaTurma().inclui(MODULOS.enquetes)
  // O cache divide estas consultas com os blocos. A página lê antes para não desenhar o bloco vazio.
  const parcelas = useProximasParcelas()
  const agenda = useResumoDaAgenda()
  const fixados = useAvisosFixados()
  const enquetes = useEnquetes()

  if (formatura.isPending) return <EsqueletoDeCartao className="h-80 overflow-hidden" />
  if (formatura.isError)
    return <ErroDaConsulta erro={formatura.error} aoTentarDeNovo={() => void formatura.refetch()} />

  const turma = formatura.data
  const fim = turma.previsao_da_festa ?? turma.previsao_de_colacao
  const dias = diasAte(fim)
  const evento = turma.previsao_da_festa ? 'a festa' : 'a colação'
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'visitante'

  // O Início apresenta só o que a turma pode usar. Esperar o plano também evita que os blocos
  // exclusivos apareçam por um instante antes de a consulta terminar. Sem registro, o bloco não
  // existe: um atalho para uma lista vazia ocupa o lugar do que a pessoa tem para fazer.
  const temParcela = !(parcelas.data && !parcelas.data.proxima)
  const temEnquetes = incluiEnquetes && !(enquetes.data && !enqueteDaHome(enquetes.data))
  const temDatas = !(agenda.data && agenda.data.proximos.length === 0)
  const temRecados = temMural && !(fixados.data && fixados.data.itens.length === 0)

  const fileiras = [
    [
      temParcela && (
        <section
          key="parcela"
          aria-labelledby="bloco-parcela"
          className="grid min-w-0 content-start gap-4 pt-8 pb-5 lg:pb-8"
        >
          <Cabecalho
            id="bloco-parcela"
            rotulo="Sua parcela"
            para={parcelas.data?.proxima ? rotaDoPagamento(parcelas.data.proxima.id) : ROTAS.extrato}
            texto={parcelas.data?.proxima ? 'Pagar parcela' : 'Ver parcelas'}
          />
          <BlocoDaParcela />
        </section>
      ),
      temEnquetes && (
        <section
          key="enquetes"
          aria-labelledby="bloco-enquetes"
          className="grid min-w-0 content-start gap-4 pt-4 pb-8 lg:pt-8"
        >
          <Cabecalho
            id="bloco-enquetes"
            rotulo="Enquetes da turma"
            para={ROTAS.enquetes}
            texto="Ver enquetes"
          />
          <BlocoDasEnquetes />
        </section>
      ),
    ],
    [
      temDatas && (
        <section
          key="datas"
          aria-labelledby="bloco-datas"
          className="grid min-w-0 content-start gap-4 pt-5 pb-5 lg:py-8"
        >
          <Cabecalho id="bloco-datas" rotulo="Próximas datas" para={ROTAS.agenda} texto="Ver agenda" />
          <ProximasDatas />
        </section>
      ),
      temRecados && (
        <section
          key="recados"
          aria-labelledby="bloco-recados"
          className="grid min-w-0 content-start gap-4 pt-4 pb-8 lg:py-8"
        >
          <Cabecalho id="bloco-recados" rotulo="Recados" para={ROTAS.mural} texto="Ver o mural" />
          <FeedDoMural />
        </section>
      ),
    ],
  ]
    .map((secoes, id) => ({ id, secoes: secoes.filter((secao) => secao !== false) }))
    .filter(({ secoes }) => secoes.length > 0)

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

      {fileiras.map(({ id, secoes: [primeira, segunda] }, indice) => (
        <Fragment key={id}>
          {indice > 0 ? <TracoDoInicio className="-my-2 h-4 w-full" /> : null}
          <div
            className={cn(
              'grid gap-y-3 lg:gap-y-0',
              segunda && 'lg:grid-cols-[minmax(0,1fr)_1rem_minmax(0,1.16fr)] lg:gap-x-4',
            )}
          >
            {primeira}
            {segunda ? (
              <>
                <TracoDoInicio
                  verticalNoDesktop
                  className="col-span-full -my-2 h-4 w-full lg:col-span-1 lg:my-8 lg:h-auto lg:w-4"
                />
                {segunda}
              </>
            ) : null}
          </div>
        </Fragment>
      ))}
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
