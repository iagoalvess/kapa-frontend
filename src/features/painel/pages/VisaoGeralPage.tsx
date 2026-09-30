import {
  Activity,
  BadgeCheck,
  CalendarClock,
  CalendarRange,
  GraduationCap,
  HandCoins,
  MailCheck,
  PiggyBank,
  ReceiptText,
  Repeat,
  Undo2,
  UserRoundX,
  Users,
  Wallet,
} from 'lucide-react'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeDados, EsqueletoDeGrafico } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltroDePeriodo, faixasDeAnalise } from '@/components/FiltroDePeriodo'
import { GraficoDeRosca } from '@/components/GraficoDeRosca'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Tabela } from '@/components/Planilha'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { ehDia, formatarCentavos, formatarMesAno, formatarNumero } from '@/lib/formato'
import { ehOpcao } from '@/lib/opcao'
import { LICENCAS } from '../components/SeloDeStatus'
import { useAnalytics, useSerieMensal } from '../hooks/usePainel'
import type { AnalyticsDaPlataforma } from '../types/painel.types'

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
  festa: 'A festa',
  financeiro: 'Despesas e fornecedores',
  formatura: 'Dados da turma',
  legal: 'Termos legais',
  loja: 'Loja',
  membro: 'Membros',
  notificacao: 'Lembretes',
  pagamento: 'Pagamentos',
  perfil: 'Cadastro',
  privacidade: 'Privacidade',
  produto: 'Opcionais',
  recebimento: 'Recebimento',
  relatorio: 'Relatórios',
  suporte: 'Suporte do Kapa',
  usuario: 'Usuários',
} as const

/**
 * A Visão geral do painel do Kapa (Sprint 44): como a plataforma está no período.
 *
 * O dinheiro vem em dois cartões que nunca se somam (P1): a receita do Kapa — as assinaturas — e o dinheiro
 * das turmas, só agregado. O segundo é caixa de formatura, e está aqui para dizer se o produto está sendo usado
 * para cobrar, não como faturamento.
 *
 * O período vive na URL (`de`/`ate`); sem ele, valem os últimos 30 dias — a mesma regra da API. A série de doze
 * meses não depende do período: é a linha do tempo que dá contexto aos números dele.
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

      {analytics.isError ? <ErroDaConsulta erro={analytics.error} /> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Cartao
          icone={Wallet}
          titulo="Receita do Kapa"
          descricao="As assinaturas das turmas. O plano anual entra no MRR dividido por doze."
        >
          {dados ? <ReceitaDoKapa kapa={dados.kapa} /> : <EsqueletoDeDados linhas={5} />}
        </Cartao>

        <Cartao
          icone={GraduationCap}
          titulo="Turmas por licença"
          descricao={
            dados
              ? `${formatarNumero(dados.formaturas.novas_no_periodo)} novas no período · ${formatarNumero(dados.formaturas.membros_por_turma_media, 1)} membros por turma em média (mediana ${formatarNumero(dados.formaturas.membros_por_turma_mediana, 1)})`
              : 'O plano em vigor de cada turma, ou o status da que parou.'
          }
          className="lg:grid-rows-[auto_1fr]"
        >
          {dados ? (
            <GraficoDeRosca
              contagem
              rotuloDoTotal="turmas"
              fatias={dados.formaturas.por_licenca.map((linha) => ({
                chave: linha.licenca,
                rotulo: ehOpcao(linha.licenca, LICENCAS) ? LICENCAS[linha.licenca].rotulo : linha.licenca,
                valor: linha.turmas,
              }))}
            />
          ) : (
            <EsqueletoDeGrafico forma="rosca" />
          )}
        </Cartao>

        <Cartao
          icone={CalendarRange}
          titulo="Últimos 12 meses"
          descricao="Cadastros, turmas novas e recebido do Kapa, mês a mês."
        >
          {serie.isError ? <ErroDaConsulta erro={serie.error} /> : null}
          {serie.isPending ? <EsqueletoDeDados linhas={6} /> : null}
          {serie.data ? (
            <Tabela
              legenda="Cadastros, turmas novas e recebido do Kapa por mês"
              cabecalho={
                <>
                  <th className="py-3 pr-4 font-normal">Mês</th>
                  <th className="py-3 pr-4 text-right font-normal">Cadastros</th>
                  <th className="py-3 pr-4 text-right font-normal">Turmas novas</th>
                  <th className="py-3 text-right font-normal">Recebido</th>
                </>
              }
            >
              {serie.data.toReversed().map((mes) => (
                <tr key={`${mes.ano}-${mes.mes}`} className="border-b last:border-0">
                  <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                    {formatarMesAno(`${mes.ano}-${String(mes.mes).padStart(2, '0')}-01`)}
                  </th>
                  <td className="py-2.5 pr-4 text-right">{formatarNumero(mes.cadastros)}</td>
                  <td className="py-2.5 pr-4 text-right">{formatarNumero(mes.turmas_novas)}</td>
                  <td className="py-2.5 text-right">{formatarCentavos(mes.recebido_em_centavos)}</td>
                </tr>
              ))}
            </Tabela>
          ) : null}
        </Cartao>

        <Cartao
          icone={Activity}
          titulo="Uso por recurso"
          descricao="Ações gravadas no período, da mais usada à menos. Só conta o que grava: abrir uma tela não entra."
        >
          {dados ? <UsoPorRecurso uso={dados.uso} /> : <EsqueletoDeDados linhas={6} />}
        </Cartao>

        <Cartao icone={Users} titulo="Contas" descricao="Quem se cadastrou na plataforma, turma ou não.">
          {dados ? <ContasDaPlataforma contas={dados.contas} /> : <EsqueletoDeDados linhas={4} />}
        </Cartao>

        <Cartao
          icone={PiggyBank}
          titulo="Dinheiro das turmas"
          descricao="As parcelas de todas as turmas, somadas. É caixa das comissões, não receita do Kapa."
        >
          {dados ? <DinheiroDasTurmas turmas={dados.turmas} /> : <EsqueletoDeDados linhas={4} />}
        </Cartao>
      </div>
    </>
  )
}

function ReceitaDoKapa({ kapa }: { kapa: AnalyticsDaPlataforma['kapa'] }) {
  return (
    <ListaDeDados>
      <Dado icone={Repeat} rotulo="Assinaturas que renovam">
        {formatarNumero(kapa.assinaturas)}
      </Dado>
      <Dado icone={Wallet} rotulo="MRR">
        {formatarCentavos(kapa.mrr_em_centavos)}
      </Dado>
      <Dado icone={HandCoins} rotulo="Recebido no período">
        {formatarCentavos(kapa.recebido_em_centavos)}
      </Dado>
      <Dado icone={CalendarClock} rotulo="A vencer em 30 dias">
        {formatarCentavos(kapa.a_vencer_em_centavos)}
      </Dado>
      <Dado icone={Undo2} rotulo="Estornado no período">
        {formatarCentavos(kapa.estornado_em_centavos)}
      </Dado>
    </ListaDeDados>
  )
}

function DinheiroDasTurmas({ turmas }: { turmas: AnalyticsDaPlataforma['turmas'] }) {
  return (
    <ListaDeDados>
      <Dado icone={HandCoins} rotulo="Pago no período">
        {formatarCentavos(turmas.pago_em_centavos)}
      </Dado>
      <Dado icone={BadgeCheck} rotulo="Parcelas pagas">
        {formatarNumero(turmas.parcelas_pagas)}
      </Dado>
      <Dado icone={ReceiptText} rotulo="A receber hoje">
        {formatarCentavos(turmas.a_receber_em_centavos)}
      </Dado>
      <Dado icone={CalendarClock} rotulo="Parcelas em aberto">
        {formatarNumero(turmas.parcelas_a_receber)}
      </Dado>
    </ListaDeDados>
  )
}

function ContasDaPlataforma({ contas }: { contas: AnalyticsDaPlataforma['contas'] }) {
  return (
    <ListaDeDados>
      <Dado icone={Users} rotulo="Cadastradas">
        {formatarNumero(contas.total)}
      </Dado>
      <Dado icone={CalendarRange} rotulo="Novas no período">
        {formatarNumero(contas.no_periodo)}
      </Dado>
      <Dado icone={MailCheck} rotulo="Com e-mail confirmado">
        {formatarNumero(contas.confirmadas)}
      </Dado>
      <Dado icone={UserRoundX} rotulo="Sem turma">
        {formatarNumero(contas.sem_turma)}
      </Dado>
    </ListaDeDados>
  )
}

function UsoPorRecurso({ uso }: { uso: AnalyticsDaPlataforma['uso'] }) {
  if (uso.length === 0)
    return <p className="text-muted-foreground text-sm">Nenhuma ação gravada no período.</p>

  return (
    <Tabela
      legenda="Ações gravadas por recurso no período"
      cabecalho={
        <>
          <th className="py-3 pr-4 font-normal">Recurso</th>
          <th className="py-3 pr-4 text-right font-normal">Ações</th>
          <th className="py-3 pr-4 text-right font-normal">Turmas</th>
          <th className="py-3 text-right font-normal">Pessoas</th>
        </>
      }
    >
      {uso.map((linha) => (
        <tr key={linha.recurso} className="border-b last:border-0">
          <th scope="row" className="py-2.5 pr-4 text-left font-normal">
            {ehOpcao(linha.recurso, RECURSOS) ? RECURSOS[linha.recurso] : linha.recurso}
          </th>
          <td className="py-2.5 pr-4 text-right">{formatarNumero(linha.eventos)}</td>
          <td className="py-2.5 pr-4 text-right">{formatarNumero(linha.turmas)}</td>
          <td className="py-2.5 text-right">{formatarNumero(linha.usuarios)}</td>
        </tr>
      ))}
    </Tabela>
  )
}
