import {
  Activity,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  Filter,
  GraduationCap,
  HandCoins,
  type LucideIcon,
  PiggyBank,
  Receipt,
  ReceiptText,
  Repeat,
  School,
  Undo2,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeDados, EsqueletoDeGrafico } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltroDePeriodo, faixasDeAnalise } from '@/components/FiltroDePeriodo'
import { GraficoDeRosca } from '@/components/GraficoDeRosca'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { ehDia, formatarCentavos, formatarMesLongo, formatarMoedaCurta, formatarNumero } from '@/lib/formato'
import { ehOpcao } from '@/lib/opcao'
import { BarrasHorizontais } from '../components/BarrasHorizontais'
import { BarrasMensais } from '../components/BarrasMensais'
import { LICENCAS } from '../components/SeloDeStatus'
import { useAnalytics, useSerieMensal } from '../hooks/usePainel'
import type { AnalyticsDaPlataforma, MesDaPlataforma } from '../types/painel.types'

/**
 * O nome de cada recurso de `recurso.acao`, como a tela o chama. Recurso novo aparece com o nome cru até
 * entrar aqui — o ranking não esconde o que não conhece.
 */
const RECURSOS = {
  adesao: 'Termo de adesão',
  agenda: 'Agenda',
  assinatura: 'Assinatura do plano',
  auth: 'Acesso',
  cobranca: 'Cobranças',
  comunicacao: 'Mural e documentos',
  conta: 'Conta',
  convite: 'Convites',
  festa: 'Festa',
  financeiro: 'Despesas e fornecedores',
  formatura: 'Dados da turma',
  legal: 'Termos legais',
  loja: 'Loja',
  membro: 'Membros',
  notificacao: 'Lembretes',
  pagamento: 'Pagamentos',
  perfil: 'Cadastro',
  privacidade: 'Privacidade',
  plano: 'Plano da turma',
  produto: 'Opcionais',
  recebimento: 'Recebimento',
  relatorio: 'Relatórios',
  suporte: 'Suporte do Kapa',
  usuario: 'Usuários',
} as const

/** Quantos recursos ganham barra própria; o resto vira "Outros", como as fatias da rosca. */
const RECURSOS_NO_RANKING = 8

/** `1 turma`, `3 turmas`. */
const plural = (quantidade: number, um: string, varios: string) =>
  `${formatarNumero(quantidade)} ${quantidade === 1 ? um : varios}`

/** O valor médio por parcela, ou um traço sem parcela nenhuma. */
const media = (valor: number, parcelas: number) =>
  parcelas > 0 ? formatarCentavos(Math.round(valor / parcelas)) : '—'

/**
 * A Visão geral do painel do Kapa (Sprint 44): como a plataforma está no período.
 *
 * O dinheiro vem em dois cartões que nunca se somam (P1): a receita do Kapa — as assinaturas — e o dinheiro
 * das turmas, só agregado. O segundo é caixa de formatura, e está aqui para dizer se o produto está sendo usado
 * para cobrar, não como faturamento.
 *
 * O período vive na URL (`de`/`ate`); sem ele, valem os últimos 30 dias — a mesma regra da API. A série de doze
 * meses não depende do período: é a linha do tempo que dá contexto aos números dele.
 *
 * Cada número tem a forma que responde à pergunta dele (07/10/2026): o tempo em colunas mês a mês, a composição na
 * rosca, o ranking e o funil em barras deitadas, e o valor único em bloco com a nota que diz contra o quê. Médias,
 * ticket e porcentagens são contas sobre o que a API já manda — nenhum endpoint novo.
 */
export default function VisaoGeralPage() {
  const { parametros, atualizar } = useFiltrosDaUrl()
  const faixas = faixasDeAnalise()
  const [padraoDe, padraoAte] = faixas['30 dias']
  const deNaUrl = parametros.get('de')
  const ateNaUrl = parametros.get('ate')
  const de = ehDia(deNaUrl) ? deNaUrl : padraoDe
  const ate = ehDia(ateNaUrl) ? ateNaUrl : padraoAte

  const analytics = useAnalytics({ de, ate })
  const serie = useSerieMensal()
  const dados = analytics.data
  const meses = serie.data ?? []

  /** Os doze meses, do mais antigo ao atual, no formato das colunas. */
  const colunas = (valor: (mes: MesDaPlataforma) => number) =>
    meses.map((mes) => {
      const dia = `${mes.ano}-${String(mes.mes).padStart(2, '0')}-01`
      const longo = formatarMesLongo(dia)

      // O eixo leva só o mês, em três letras: "jan. de 26" não cabe numa coluna. O ano fica na dica.
      return { chave: dia, rotulo: longo.slice(0, 3), rotuloLongo: longo, valor: valor(mes) }
    })

  /** O miolo de um cartão da série mensal: o erro, o esqueleto ou as colunas. */
  const serieMensal = (conteudo: () => ReactNode) => {
    if (serie.isError)
      return <ErroDaConsulta compacto erro={serie.error} aoTentarDeNovo={() => void serie.refetch()} />

    return serie.data ? conteudo() : <EsqueletoDeGrafico />
  }

  return (
    <>
      <FiltroDePeriodo
        legenda="Período"
        faixas={faixas}
        de={de}
        ate={ate}
        aoMudar={(faixa) => atualizar(faixa)}
      />

      <FaixaDeIndicadores
        rotulo="A plataforma no período"
        indicadores={[
          {
            rotulo: 'Turmas pagantes',
            valor: dados?.formaturas.pagantes ?? null,
            unidade: dados ? `de ${formatarNumero(dados.formaturas.total)}` : undefined,
            icone: GraduationCap,
            serie: meses.map((mes) => mes.turmas_novas),
          },
          {
            rotulo: 'MRR',
            valor: dados ? formatarCentavos(dados.kapa.mrr_em_centavos) : null,
            icone: Repeat,
          },
          {
            rotulo: 'Contas',
            valor: dados?.contas.total ?? null,
            nota: dados ? `+${formatarNumero(dados.contas.no_periodo)} no período` : undefined,
            icone: Users,
            serie: meses.map((mes) => mes.cadastros),
          },
          {
            rotulo: 'Recebido no período',
            valor: dados ? formatarCentavos(dados.kapa.recebido_em_centavos) : null,
            icone: Wallet,
            serie: meses.map((mes) => mes.recebido_em_centavos),
          },
        ]}
      />

      {analytics.isError ? (
        <ErroDaConsulta erro={analytics.error} aoTentarDeNovo={() => void analytics.refetch()} />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <Cartao
          icone={BarChart3}
          titulo="Receita do Kapa por mês"
          descricao="As assinaturas pagas nos últimos 12 meses. O mês atual vem em destaque."
          className="lg:col-span-2"
        >
          {serieMensal(() => (
            <BarrasMensais
              legenda="Recebido do Kapa por mês"
              meses={colunas((mes) => mes.recebido_em_centavos)}
              formatar={formatarCentavos}
              formatarEixo={(valor) => formatarMoedaCurta(valor)}
              alta
            />
          ))}
        </Cartao>

        <Cartao
          icone={Wallet}
          titulo="Receita do Kapa"
          descricao="As assinaturas das turmas. O plano anual entra no MRR dividido por doze."
        >
          {dados ? <ReceitaDoKapa kapa={dados.kapa} /> : <EsqueletoDeDados linhas={5} />}
        </Cartao>

        <Cartao
          icone={UserPlus}
          titulo="Cadastros por mês"
          descricao="Contas novas na plataforma, com turma ou não."
        >
          {serieMensal(() => (
            <BarrasMensais
              legenda="Cadastros por mês"
              meses={colunas((mes) => mes.cadastros)}
              formatar={(valor) => formatarNumero(valor)}
            />
          ))}
        </Cartao>

        <Cartao
          icone={School}
          titulo="Turmas novas por mês"
          descricao="Turmas criadas, pagantes ou no gratuito."
        >
          {serieMensal(() => (
            <BarrasMensais
              legenda="Turmas novas por mês"
              meses={colunas((mes) => mes.turmas_novas)}
              formatar={(valor) => formatarNumero(valor)}
            />
          ))}
        </Cartao>

        <Cartao
          icone={Filter}
          titulo="Funil das contas"
          descricao={
            dados
              ? `Quantas das contas cadastradas chegaram a cada passo — a porcentagem é sobre o total. ${formatarNumero(dados.contas.no_periodo)} contas novas no período.`
              : 'Quantas das contas cadastradas chegaram a cada passo — a porcentagem é sobre o total.'
          }
        >
          {dados ? <FunilDasContas contas={dados.contas} /> : <EsqueletoDeDados linhas={3} />}
        </Cartao>

        <Cartao
          icone={GraduationCap}
          titulo="Turmas por licença"
          descricao="O plano em vigor de cada turma, ou o status da que parou."
        >
          {dados ? <TurmasPorLicenca formaturas={dados.formaturas} /> : <EsqueletoDeGrafico forma="rosca" />}
        </Cartao>

        <Cartao
          icone={Activity}
          titulo="Uso por recurso"
          descricao="Ações gravadas no período, da mais usada à menos. Só conta o que grava: abrir uma tela não entra."
          className="lg:col-span-2"
        >
          {dados ? <UsoPorRecurso uso={dados.uso} /> : <EsqueletoDeDados linhas={6} />}
        </Cartao>

        <Cartao
          icone={PiggyBank}
          titulo="Dinheiro das turmas"
          descricao="As parcelas de todas as turmas, somadas. É caixa das comissões, não receita do Kapa."
          className="lg:col-span-3"
        >
          {dados ? <DinheiroDasTurmas turmas={dados.turmas} /> : <EsqueletoDeDados linhas={2} />}
        </Cartao>
      </div>
    </>
  )
}

/** Um número com rótulo e uma nota miúda — os blocos de dentro dos cartões. */
function Metrica({
  icone: Icone,
  rotulo,
  valor,
  nota,
}: {
  icone: LucideIcon
  rotulo: string
  valor: string
  nota?: string
}) {
  return (
    <div className="bg-muted/50 grid content-start gap-1 rounded-xl p-4">
      <dt className="text-muted-foreground flex items-center gap-2 text-sm">
        <Icone aria-hidden className="size-4 shrink-0" />
        {rotulo}
      </dt>
      <dd className="text-foreground text-xl font-medium tabular-nums">{valor}</dd>
      {nota ? <dd className="text-texto-muted text-xs">{nota}</dd> : null}
    </div>
  )
}

/**
 * O MRR em destaque, com a projeção anual, e embaixo o que entrou, o que vence, o que voltou e o ticket. O estornado
 * vem como parte do recebido: um número solto não diz se é muito.
 */
function ReceitaDoKapa({ kapa }: { kapa: AnalyticsDaPlataforma['kapa'] }) {
  const estornoSobreRecebido =
    kapa.recebido_em_centavos > 0
      ? Math.round((kapa.estornado_em_centavos / kapa.recebido_em_centavos) * 100)
      : 0

  return (
    <div className="grid gap-5">
      <div className="grid gap-1">
        <p className="text-muted-foreground text-sm">MRR</p>
        <p className="text-foreground text-4xl font-semibold tabular-nums">
          {formatarCentavos(kapa.mrr_em_centavos)}
        </p>
        <p className="text-texto-muted text-sm">
          {formatarCentavos(kapa.mrr_em_centavos * 12)} por ano no ritmo de hoje ·{' '}
          {formatarNumero(kapa.assinaturas)}{' '}
          {kapa.assinaturas === 1 ? 'assinatura renova' : 'assinaturas renovam'}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <Metrica
          icone={HandCoins}
          rotulo="Recebido"
          valor={formatarCentavos(kapa.recebido_em_centavos)}
          nota="no período"
        />
        <Metrica
          icone={CalendarClock}
          rotulo="A vencer"
          valor={formatarCentavos(kapa.a_vencer_em_centavos)}
          nota="nos próximos 30 dias"
        />
        <Metrica
          icone={Undo2}
          rotulo="Estornado"
          valor={formatarCentavos(kapa.estornado_em_centavos)}
          nota={kapa.estornado_em_centavos > 0 ? `${estornoSobreRecebido}% do recebido` : 'nada no período'}
        />
        <Metrica
          icone={Receipt}
          rotulo="Ticket médio"
          valor={
            kapa.assinaturas > 0 ? formatarCentavos(Math.round(kapa.mrr_em_centavos / kapa.assinaturas)) : '—'
          }
          nota="MRR por assinatura"
        />
      </dl>
    </div>
  )
}

/** A rosca das licenças e, embaixo, quantas pagam — a conversão do gratuito é a pergunta do painel. */
function TurmasPorLicenca({ formaturas }: { formaturas: AnalyticsDaPlataforma['formaturas'] }) {
  const conversao = formaturas.total > 0 ? Math.round((formaturas.pagantes / formaturas.total) * 100) : 0

  return (
    <div className="grid gap-5">
      <GraficoDeRosca
        contagem
        rotuloDoTotal="turmas"
        fatias={formaturas.por_licenca.map((linha) => ({
          chave: linha.licenca,
          rotulo: ehOpcao(linha.licenca, LICENCAS) ? LICENCAS[linha.licenca].rotulo : linha.licenca,
          valor: linha.turmas,
        }))}
      />
      <div className="grid gap-1.5">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-foreground">Pagam o Kapa</span>
          <span className="text-foreground font-medium tabular-nums">{conversao}%</span>
        </div>
        <div aria-hidden className="bg-muted h-2 overflow-hidden rounded-full">
          <div className="bg-brand h-full rounded-full" style={{ width: `${conversao}%` }} />
        </div>
        <p className="text-texto-muted text-xs">
          {formatarNumero(formaturas.novas_no_periodo)} novas no período ·{' '}
          {formatarNumero(formaturas.membros_por_turma_media, 1)} membros por turma em média (mediana{' '}
          {formatarNumero(formaturas.membros_por_turma_mediana, 1)})
        </p>
      </div>
    </div>
  )
}

/** Cadastrou, confirmou o e-mail, entrou numa turma: cada passo como parte do primeiro. */
function FunilDasContas({ contas }: { contas: AnalyticsDaPlataforma['contas'] }) {
  return (
    <BarrasHorizontais
      funil
      formatar={(valor) => formatarNumero(valor)}
      itens={[
        { chave: 'cadastradas', rotulo: 'Cadastradas', valor: contas.total },
        { chave: 'confirmadas', rotulo: 'Com e-mail confirmado', valor: contas.confirmadas },
        { chave: 'em-turma', rotulo: 'Numa turma', valor: Math.max(0, contas.total - contas.sem_turma) },
      ]}
    />
  )
}

function UsoPorRecurso({ uso }: { uso: AnalyticsDaPlataforma['uso'] }) {
  if (uso.length === 0)
    return <p className="text-muted-foreground text-sm">Nenhuma ação gravada no período.</p>

  const resto = uso.slice(RECURSOS_NO_RANKING)

  return (
    <BarrasHorizontais
      formatar={(valor) => formatarNumero(valor)}
      itens={[
        ...uso.slice(0, RECURSOS_NO_RANKING).map((linha) => ({
          chave: linha.recurso,
          rotulo: ehOpcao(linha.recurso, RECURSOS) ? RECURSOS[linha.recurso] : linha.recurso,
          valor: linha.eventos,
          detalhe: `${plural(linha.turmas, 'turma', 'turmas')} · ${plural(linha.usuarios, 'pessoa', 'pessoas')}`,
        })),
        ...(resto.length > 0
          ? [
              {
                chave: 'outros',
                rotulo: `Outros (${resto.length})`,
                valor: resto.reduce((soma, linha) => soma + linha.eventos, 0),
              },
            ]
          : []),
      ]}
    />
  )
}

/** O pago e o que falta, cada um com a média por parcela — o tamanho da parcela diz o perfil das turmas. */
function DinheiroDasTurmas({ turmas }: { turmas: AnalyticsDaPlataforma['turmas'] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metrica
        icone={HandCoins}
        rotulo="Pago no período"
        valor={formatarCentavos(turmas.pago_em_centavos)}
        nota={`${formatarNumero(turmas.parcelas_pagas)} ${turmas.parcelas_pagas === 1 ? 'parcela paga' : 'parcelas pagas'}`}
      />
      <Metrica
        icone={BadgeCheck}
        rotulo="Média da parcela paga"
        valor={media(turmas.pago_em_centavos, turmas.parcelas_pagas)}
        nota="no período"
      />
      <Metrica
        icone={ReceiptText}
        rotulo="A receber hoje"
        valor={formatarCentavos(turmas.a_receber_em_centavos)}
        nota={`${formatarNumero(turmas.parcelas_a_receber)} ${turmas.parcelas_a_receber === 1 ? 'parcela em aberto' : 'parcelas em aberto'}`}
      />
      <Metrica
        icone={CalendarClock}
        rotulo="Média da parcela em aberto"
        valor={media(turmas.a_receber_em_centavos, turmas.parcelas_a_receber)}
        nota="hoje"
      />
    </dl>
  )
}
