import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarClock,
  CheckCheck,
  Clock,
  Coins,
  Gauge,
  HandCoins,
  Handshake,
  Inbox,
  Mail,
  PiggyBank,
  Scale,
  ScrollText,
  Send,
  UserRoundCheck,
  Wallet,
} from 'lucide-react'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { Interruptor } from '@/components/Interruptor'
import { Selo, type TomDoSelo } from '@/components/Selo'
import { Tabela } from '@/components/Planilha'
import { LinhaDeAuditoria } from '@/features/auditoria/components/LinhaDeAuditoria'
import type { LinhaDeAuditoria as LinhaDaTrilha } from '@/features/auditoria/types/auditoria.types'
import {
  marcoDoDegrau,
  type Regra,
  type StatusDaNotificacao,
  destinoDoDegrau,
  tomDoDegrau,
} from '@/features/notificacoes/types/notificacoes.types'
import { ROTULOS_DE_STATUS } from '@/features/notificacoes/types/notificacoes.types'
import { GraficoDeCaixa, type MesDoGrafico } from '@/components/GraficoDeCaixa'
import { GraficoDeRosca } from '@/components/GraficoDeRosca'
import { FiltrosDoRelatorio } from '@/features/relatorios/components/FiltrosDoRelatorio'
import { MedidorDeAdimplencia } from '@/features/relatorios/components/MedidorDeAdimplencia'
import { QuadroDoBalancete } from '@/features/relatorios/components/QuadroDoBalancete'
import type {
  Adimplencia,
  LinhaDeBalancete,
  OpcoesDeFiltro,
} from '@/features/relatorios/types/relatorios.types'
import { formatarCentavos } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { BarraDaPrevia, RodapeDaPrevia } from './ElementosDaPrevia'

/*
  As maquetes da gestão repetem o desenho das telas de verdade — faixa, filtros, cartões e tabelas —
  com dados de exemplo. Nenhuma consulta sai daqui: é o fundo desfocado da área fora do plano, e o
  `<AreaBloqueada>` mantém tudo inerte.
*/

const semAcao = () => undefined

/** O sentido do aviso, com a mesma cor das telas reais. */
const TONS_DO_AVISO: Record<StatusDaNotificacao, TomDoSelo> = {
  Entregue: 'sucesso',
  Enfileirada: 'cinza',
  Falhou: 'perigo',
}

interface AvisoEnviado {
  nome: string | null
  destinatario: string
  assunto: string
  marco: string
  dia: string
  status: StatusDaNotificacao
  erro: string | null
}

const AVISOS_ENVIADOS: AvisoEnviado[] = [
  {
    nome: 'Ana Beatriz Lima',
    destinatario: 'ana.lima@email.com',
    assunto: 'Sua parcela vence em 3 dias',
    marco: marcoDoDegrau({ gatilho: 'Vencimento', dias_de_deslocamento: -3 }),
    dia: '02/10/2026',
    status: 'Entregue',
    erro: null,
  },
  {
    nome: 'Bruno Alves Rocha',
    destinatario: 'bruno.rocha@email.com',
    assunto: 'Sua parcela vence hoje',
    marco: marcoDoDegrau({ gatilho: 'Vencimento', dias_de_deslocamento: 0 }),
    dia: '02/10/2026',
    status: 'Entregue',
    erro: null,
  },
  {
    nome: 'Carla Menezes',
    destinatario: 'carla.menezes@email.com',
    assunto: 'Parcela em atraso há 3 dias',
    marco: marcoDoDegrau({ gatilho: 'Vencimento', dias_de_deslocamento: 3 }),
    dia: '01/10/2026',
    status: 'Falhou',
    erro: 'Endereço recusado: caixa cheia',
  },
  {
    nome: 'Diego Farias',
    destinatario: 'diego.farias@email.com',
    assunto: 'Sua parcela vence em 5 dias',
    marco: marcoDoDegrau({ gatilho: 'Vencimento', dias_de_deslocamento: -5 }),
    dia: '01/10/2026',
    status: 'Enfileirada',
    erro: null,
  },
  {
    nome: null,
    destinatario: 'tesouraria@kapa.com.br',
    assunto: 'Pagamento aguardando conferência',
    marco: marcoDoDegrau({ gatilho: 'InformePendente', dias_de_deslocamento: 1 }),
    dia: '30/09/2026',
    status: 'Entregue',
    erro: null,
  },
]

/** O histórico dos avisos enviados: quem recebeu o quê, quando e com qual resultado. */
export function PreviaDeAvisos() {
  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo dos avisos"
        indicadores={[
          { rotulo: 'Avisos no filtro', valor: 212, icone: Send },
          { rotulo: 'Entregues nesta página', valor: 4, icone: CheckCheck },
          {
            rotulo: 'Falhas nesta página',
            valor: 1,
            icone: AlertTriangle,
            sinal: { texto: 'conferir contatos', tom: 'negativo' },
          },
          { rotulo: 'Último envio', valor: 'Hoje, às 9h', icone: Clock },
        ]}
      />

      <BarraDaPrevia busca="Buscar destinatário" filtros={['Na fila', 'Entregue', 'Falhou']} total={212} />

      <Cartao rotulo="Avisos enviados" className="px-5 py-2">
        <Tabela
          emLista
          legenda="Avisos enviados"
          cabecalho={
            <>
              <th className="py-3 pr-4 font-normal">Destinatário</th>
              <th className="py-3 pr-4 font-normal">Assunto</th>
              <th className="py-3 pr-4 font-normal">Momento do lembrete</th>
              <th className="py-3 pr-4 font-normal">Dia</th>
              <th className="py-3 font-normal">Resultado</th>
            </>
          }
        >
          {AVISOS_ENVIADOS.map((aviso, indice) => (
            <tr key={`${aviso.destinatario}-${indice}`} className="border-b last:border-0">
              <td className="max-w-56 py-3 pr-4">
                <p className="text-foreground truncate font-medium">{aviso.nome ?? 'Tesouraria'}</p>
                <p className="text-texto-muted truncate text-xs">{aviso.destinatario}</p>
              </td>
              <td className="text-muted-foreground max-w-72 truncate py-3 pr-4">{aviso.assunto}</td>
              <td className="text-muted-foreground py-3 pr-4">{aviso.marco}</td>
              <td className="text-muted-foreground py-3 pr-4 whitespace-nowrap">{aviso.dia}</td>
              <td className="py-3">
                <Selo tom={TONS_DO_AVISO[aviso.status]}>{ROTULOS_DE_STATUS[aviso.status]}</Selo>
                {aviso.erro ? (
                  <p className="text-texto-muted mt-1 max-w-56 truncate text-xs">{aviso.erro}</p>
                ) : null}
              </td>
            </tr>
          ))}
        </Tabela>
      </Cartao>

      <RodapeDaPrevia total={212} />
    </>
  )
}

const REGRAS: Regra[] = [
  {
    id: 'r1',
    gatilho: 'Vencimento',
    dias_de_deslocamento: -5,
    assunto: 'Sua parcela vence em 5 dias',
    ativa: true,
    avisar_tesouraria: false,
  },
  {
    id: 'r2',
    gatilho: 'Vencimento',
    dias_de_deslocamento: -3,
    assunto: 'Sua parcela vence em 3 dias',
    ativa: true,
    avisar_tesouraria: false,
  },
  {
    id: 'r3',
    gatilho: 'Vencimento',
    dias_de_deslocamento: 0,
    assunto: 'Hoje vence a sua parcela',
    ativa: true,
    avisar_tesouraria: true,
  },
  {
    id: 'r4',
    gatilho: 'Vencimento',
    dias_de_deslocamento: 3,
    assunto: 'Sua parcela está em atraso',
    ativa: true,
    avisar_tesouraria: false,
  },
  {
    id: 'r5',
    gatilho: 'Vencimento',
    dias_de_deslocamento: 10,
    assunto: 'Parcela em atraso com multa e juros',
    ativa: true,
    avisar_tesouraria: true,
  },
  {
    id: 'r6',
    gatilho: 'Vencimento',
    dias_de_deslocamento: 30,
    assunto: 'Cobrança firme da parcela em atraso',
    ativa: false,
    avisar_tesouraria: false,
  },
  {
    id: 'r7',
    gatilho: 'InformePendente',
    dias_de_deslocamento: 1,
    assunto: 'Pagamento aguardando conferência',
    ativa: true,
    avisar_tesouraria: true,
  },
]

const VENCIMENTOS = REGRAS.filter((regra) => regra.gatilho === 'Vencimento').toSorted(
  (a, b) => a.dias_de_deslocamento - b.dias_de_deslocamento,
)
const FILA = REGRAS.filter((regra) => regra.gatilho === 'InformePendente')
const REGRAS_ATIVAS = REGRAS.filter((regra) => regra.ativa).length

/** A régua de cobrança da turma: os degraus na tabela e a sequência desenhada ao lado. */
export function PreviaDeLembretes() {
  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo dos lembretes"
        indicadores={[
          {
            rotulo: 'Lembretes ativos',
            valor: REGRAS_ATIVAS,
            unidade: `de ${REGRAS.length}`,
            icone: CalendarClock,
          },
          {
            rotulo: 'Avisos enviados',
            valor: 1284,
            nota: 'desde o início da turma',
            icone: Mail,
          },
          {
            rotulo: 'Também avisam a tesouraria',
            valor: REGRAS.filter((regra) => regra.ativa && regra.avisar_tesouraria).length,
            unidade: 'lembretes',
            icone: Bell,
          },
          { rotulo: 'Janela de envio', valor: '9h às 20h', unidade: 'dias úteis', icone: CalendarClock },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <Cartao
          titulo="Lembretes de cobrança"
          icone={CalendarClock}
          descricao="Veja quando cada lembrete é enviado. Cada formando recebe no máximo uma mensagem por dia."
        >
          <TabelaDeDegraus>
            {VENCIMENTOS.map((regra) => (
              <LinhaDoDegrau key={regra.id} regra={regra} />
            ))}
          </TabelaDeDegraus>

          <section aria-label="Fila da tesouraria" className="grid gap-3 border-t pt-5">
            <div className="flex items-start gap-3">
              <span className="bg-brand-tint text-brand-text inline-flex size-8 shrink-0 items-center justify-center rounded-lg">
                <Inbox className="size-4" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="grid gap-0.5">
                <h3 className="text-foreground font-medium">Fila da tesouraria</h3>
                <p className="text-muted-foreground text-sm">
                  Quando um formando avisa que pagou, a cobrança fica pausada até a tesouraria conferir.
                </p>
              </div>
            </div>
            <TabelaDeDegraus>
              {FILA.map((regra) => (
                <LinhaDoDegrau key={regra.id} regra={regra} />
              ))}
            </TabelaDeDegraus>
          </section>
        </Cartao>

        <Cartao
          titulo="Sequência de lembretes"
          descricao="Quando cada mensagem é enviada"
          className="hidden grid-rows-[auto_1fr] lg:grid"
        >
          <SequenciaDeLembretes degraus={VENCIMENTOS} />
        </Cartao>
      </div>
    </>
  )
}

function TabelaDeDegraus({ children }: { children: React.ReactNode }) {
  return (
    <Tabela
      emLista
      cabecalho={
        <>
          <th className="py-3 pr-4 font-normal">Quando</th>
          <th className="py-3 pr-4 font-normal">Mensagem</th>
          <th className="py-3 pr-4 font-normal">Vai para</th>
          <th className="py-3 pr-4 font-normal">Assunto</th>
          <th className="py-3 font-normal">Situação</th>
        </>
      }
    >
      {children}
    </Tabela>
  )
}

function LinhaDoDegrau({ regra }: { regra: Regra }) {
  return (
    <tr className="border-b last:border-0">
      <td className="text-foreground py-3 pr-4 font-medium tabular-nums">{marcoDoDegrau(regra)}</td>
      <td className="py-3 pr-4 whitespace-nowrap">{tomDoDegrau(regra)}</td>
      <td className="py-3 pr-4 whitespace-nowrap">{destinoDoDegrau(regra)}</td>
      <td className="max-w-64 truncate py-3 pr-4">{regra.assunto}</td>
      <td className="py-3 whitespace-nowrap">
        <span className="inline-flex items-center gap-2">
          <Interruptor
            ligado={regra.ativa}
            rotulo={`${marcoDoDegrau(regra)} — ${tomDoDegrau(regra)}`}
            aoAlternar={semAcao}
          />
          {regra.ativa ? 'Ativo' : 'Desligado'}
        </span>
      </td>
    </tr>
  )
}

function SequenciaDeLembretes({ degraus }: { degraus: Regra[] }) {
  return (
    <ol className="flex flex-col">
      {degraus.map((regra, indice) => (
        <li
          key={regra.id}
          className={cn(
            'relative flex flex-1 items-start gap-3 pb-5 pl-6 last:flex-none last:pb-0',
            !regra.ativa && 'opacity-50',
          )}
        >
          {indice < degraus.length - 1 ? (
            <span className="bg-brand absolute top-[26px] -bottom-3.5 left-[5px] w-0.5" aria-hidden />
          ) : null}
          <span className="bg-brand absolute top-3.5 left-0 size-3 rounded-full" aria-hidden />
          <span className="bg-brand-tint text-brand-text inline-flex size-10 shrink-0 items-center justify-center rounded-full">
            <Mail className="size-4" aria-hidden />
          </span>
          <TextoDoCartao as="div" className="grid min-w-0 flex-1 gap-0.5">
            <span className="text-foreground font-medium tabular-nums">{marcoDoDegrau(regra)}</span>
            <span className="text-muted-foreground">{tomDoDegrau(regra)}</span>
            <span className="text-muted-foreground">Para o {destinoDoDegrau(regra).toLowerCase()}</span>
          </TextoDoCartao>
          <TextoDoCartao className="bg-brand-tint text-foreground w-36 shrink-0 rounded-xl px-3 py-2">
            {regra.assunto}
          </TextoDoCartao>
        </li>
      ))}
    </ol>
  )
}

const MESES: MesDoGrafico[] = [
  {
    mes: '2026-03-01',
    projetado: false,
    entradas_em_centavos: 1840000,
    entradas_previstas_em_centavos: 0,
    saidas_em_centavos: 920000,
    saidas_previstas_em_centavos: 0,
    saldo_acumulado_em_centavos: 920000,
  },
  {
    mes: '2026-04-01',
    projetado: false,
    entradas_em_centavos: 2400000,
    entradas_previstas_em_centavos: 0,
    saidas_em_centavos: 1280000,
    saidas_previstas_em_centavos: 0,
    saldo_acumulado_em_centavos: 2040000,
  },
  {
    mes: '2026-05-01',
    projetado: false,
    entradas_em_centavos: 2120000,
    entradas_previstas_em_centavos: 0,
    saidas_em_centavos: 1640000,
    saidas_previstas_em_centavos: 0,
    saldo_acumulado_em_centavos: 2520000,
  },
  {
    mes: '2026-06-01',
    projetado: false,
    entradas_em_centavos: 2860000,
    entradas_previstas_em_centavos: 0,
    saidas_em_centavos: 1040000,
    saidas_previstas_em_centavos: 0,
    saldo_acumulado_em_centavos: 4340000,
  },
  {
    mes: '2026-07-01',
    projetado: false,
    entradas_em_centavos: 2540000,
    entradas_previstas_em_centavos: 0,
    saidas_em_centavos: 820000,
    saidas_previstas_em_centavos: 0,
    saldo_acumulado_em_centavos: 6060000,
  },
  {
    mes: '2026-08-01',
    projetado: false,
    entradas_em_centavos: 2740000,
    entradas_previstas_em_centavos: 0,
    saidas_em_centavos: 1180000,
    saidas_previstas_em_centavos: 0,
    saldo_acumulado_em_centavos: 7620000,
  },
]

const FATIAS = [
  { chave: 'buffet', rotulo: 'Buffet e jantar', valor: 1860000 },
  { chave: 'espaco', rotulo: 'Espaço da festa', valor: 1480000 },
  { chave: 'decoracao', rotulo: 'Decoração', valor: 920000 },
  { chave: 'som', rotulo: 'Som e iluminação', valor: 640000 },
  { chave: 'banda', rotulo: 'Banda e DJ', valor: 520000 },
  { chave: 'foto', rotulo: 'Fotografia', valor: 480000 },
  { chave: 'convites', rotulo: 'Convites e papelaria', valor: 300000 },
]

const SAIDAS_POR_CATEGORIA: LinhaDeBalancete[] = [
  { rotulo: 'Local e buffet', quantidade: 6, valor_em_centavos: 3340000 },
  { rotulo: 'Decoração', quantidade: 3, valor_em_centavos: 920000 },
  { rotulo: 'Audiovisual', quantidade: 2, valor_em_centavos: 1160000 },
  { rotulo: 'Papelaria', quantidade: 2, valor_em_centavos: 480000 },
  { rotulo: 'Outros', quantidade: 4, valor_em_centavos: 300000 },
]

const SAIDAS_POR_FORNECEDOR: LinhaDeBalancete[] = [
  { rotulo: 'Buffet Jardim', quantidade: 3, valor_em_centavos: 1860000 },
  { rotulo: 'Espaço Aurora', quantidade: 2, valor_em_centavos: 1480000 },
  { rotulo: 'Ateliê das Flores', quantidade: 2, valor_em_centavos: 920000 },
  { rotulo: 'Luz & Som Eventos', quantidade: 2, valor_em_centavos: 640000 },
  { rotulo: 'Memória Fotografia', quantidade: 2, valor_em_centavos: 480000 },
  { rotulo: 'Papel & Festa', quantidade: 2, valor_em_centavos: 300000 },
  { rotulo: 'Banda Horizonte', quantidade: 2, valor_em_centavos: 520000 },
]

const ENTRADAS: LinhaDeBalancete[] = [
  { rotulo: 'Mensalidade', quantidade: 186, valor_em_centavos: 12480000 },
  { rotulo: 'Taxa de adesão', quantidade: 41, valor_em_centavos: 1640000 },
  { rotulo: 'Convites da loja', quantidade: 32, valor_em_centavos: 480000 },
]

const OUTRAS_RECEITAS: LinhaDeBalancete[] = [
  { rotulo: 'Patrocínio', quantidade: 2, valor_em_centavos: 800000 },
  { rotulo: 'Evento beneficente', quantidade: 1, valor_em_centavos: 420000 },
  { rotulo: 'Rendimento', quantidade: 4, valor_em_centavos: 96000 },
]

const ADIMPLENCIA: Adimplencia = {
  devido_em_centavos: 21600000,
  recebido_em_centavos: 19850000,
  em_atraso_em_centavos: 1750000,
  percentual_base_dez_mil: 9190,
}

const OPCOES_DE_FILTRO: OpcoesDeFiltro = {
  fornecedores: [
    { id: 'f1', nome: 'Buffet Jardim' },
    { id: 'f2', nome: 'Espaço Aurora' },
    { id: 'f3', nome: 'Ateliê das Flores' },
  ],
  formandos: [
    { id: 'v1', nome: 'Ana Beatriz Lima' },
    { id: 'v2', nome: 'Bruno Alves Rocha' },
  ],
  itens: [
    { id: 'i1', nome: 'Mensalidade' },
    { id: 'i2', nome: 'Taxa de adesão' },
  ],
}

/** O balancete, as exportações e a fila de PDFs, como a tela de relatórios do modelo. */
export function PreviaDeRelatorios() {
  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo do período"
        indicadores={[
          {
            rotulo: 'Entradas no período',
            valor: formatarCentavos(14400000),
            icone: ArrowUpRight,
            sinal: { texto: '+12%', tom: 'positivo' },
            nota: 'vs. período anterior',
            serie: MESES.map((mes) => mes.entradas_em_centavos),
          },
          {
            rotulo: 'Saídas no período',
            valor: formatarCentavos(6200000),
            icone: ArrowDownRight,
            sinal: { texto: '-4%', tom: 'positivo' },
            nota: 'vs. período anterior',
            serie: MESES.map((mes) => mes.saidas_em_centavos),
          },
          {
            rotulo: 'Resultado do período',
            valor: formatarCentavos(8200000),
            icone: Scale,
            nota: `antes: ${formatarCentavos(6913200)}`,
            serie: MESES.map((mes) => mes.entradas_em_centavos - mes.saidas_em_centavos),
          },
          { rotulo: 'Saldo em caixa hoje', valor: formatarCentavos(12238000), icone: Wallet },
        ]}
      />

      <FiltrosDoRelatorio
        filtro={{}}
        opcoes={OPCOES_DE_FILTRO}
        formato="excel"
        aoMudar={semAcao}
        aoTrocarFormato={semAcao}
        aoExportar={semAcao}
        ocupado={false}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Cartao
          titulo="Entradas e saídas no período"
          icone={Coins}
          descricao="Mês a mês, dentro do intervalo escolhido — a soma dos meses é o total dos indicadores."
          className="min-w-0 lg:col-span-2"
        >
          <GraficoDeCaixa meses={MESES} />
        </Cartao>

        <Cartao
          titulo="No que saiu"
          icone={PiggyBank}
          descricao="As saídas do período, em fatia."
          className="min-w-0 lg:grid-rows-[auto_1fr]"
        >
          <GraficoDeRosca fatias={FATIAS} rotuloDoTotal="saiu" />
        </Cartao>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <QuadroDoBalancete
          titulo="Saídas por categoria"
          icone={PiggyBank}
          descricao="O que a turma pagou no período, por tipo de gasto."
          rotuloDaColuna="Categoria"
          linhas={SAIDAS_POR_CATEGORIA}
        />

        <QuadroDoBalancete
          titulo="Saídas por fornecedor"
          icone={Handshake}
          descricao="As mesmas saídas, abertas por quem a turma contratou — os dois quadros somam o mesmo total."
          rotuloDaColuna="Fornecedor"
          linhas={SAIDAS_POR_FORNECEDOR}
        />

        <QuadroDoBalancete
          titulo="Entradas por tipo de cobrança"
          icone={Coins}
          descricao="As parcelas pagas no período, pelo item de cobrança que as originou."
          rotuloDaColuna="Item"
          linhas={ENTRADAS}
        />

        <QuadroDoBalancete
          titulo="Outras receitas"
          icone={HandCoins}
          descricao="O que entrou sem ser parcela de formando: patrocínio, evento, doação, rendimento."
          rotuloDaColuna="Categoria"
          linhas={OUTRAS_RECEITAS}
        />

        <Cartao
          titulo="Adimplência hoje"
          icone={Gauge}
          descricao="Do que já venceu, quanto entrou. Não depende do período escolhido."
          className="lg:col-span-2 lg:grid-rows-[auto_1fr]"
        >
          <MedidorDeAdimplencia adimplencia={ADIMPLENCIA} />
        </Cartao>
      </div>
    </>
  )
}

const TRILHA: LinhaDaTrilha[] = [
  {
    id: 'a1',
    nome: 'pagamento.baixado',
    ocorrido_em: '2026-10-02T21:14:00Z',
    autor_usuario_id: 'u1',
    autor: 'Marina Costa',
    dados: JSON.stringify({
      parcelaId: '11111111-1111-1111-1111-111111111111',
      valorEmCentavos: 84000,
      forma: 'Pix',
    }),
    pessoas: { '11111111-1111-1111-1111-111111111111': 'Ana Beatriz Lima' },
  },
  {
    id: 'a2',
    nome: 'membro.papel_alterado',
    ocorrido_em: '2026-09-29T15:02:00Z',
    autor_usuario_id: 'u2',
    autor: 'Rafael Almeida',
    dados: JSON.stringify({
      membroUsuarioId: '22222222-2222-2222-2222-222222222222',
      antes: { papel: 'Formando' },
      depois: { papel: 'Tesoureiro' },
    }),
    pessoas: { '22222222-2222-2222-2222-222222222222': 'Bruno Alves Rocha' },
  },
  {
    id: 'a3',
    nome: 'recebimento.conta_alterada',
    ocorrido_em: '2026-09-26T10:40:00Z',
    autor_usuario_id: 'u1',
    autor: 'Marina Costa',
    dados: JSON.stringify({
      antes: { chave: '•••• 4321', tipoDeChave: 'Aleatoria' },
      depois: { chave: '•••• 9876', tipoDeChave: 'Cnpj' },
    }),
    pessoas: {},
  },
  {
    id: 'a4',
    nome: 'comunicacao.aviso_excluido',
    ocorrido_em: '2026-09-21T03:00:00Z',
    autor_usuario_id: null,
    autor: null,
    dados: JSON.stringify({ titulo: 'Ensaio da colação confirmado' }),
    pessoas: {},
  },
]

/** A trilha de auditoria: quem fez o quê com o dinheiro da turma, e o que mudou. */
export function PreviaDeAuditoria() {
  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo da trilha"
        indicadores={[
          {
            rotulo: 'Ações registradas',
            valor: 1284,
            unidade: 'no total',
            icone: ScrollText,
            nota: 'Mais comum: Baixa de parcela',
          },
          { rotulo: 'Nos últimos 30 dias', valor: 212, unidade: 'ações', icone: CalendarClock },
          { rotulo: 'Última ação', valor: 'ontem', icone: Clock, nota: 'Baixa de parcela' },
          {
            rotulo: 'Quem mais fez',
            valor: 'Marina Costa',
            icone: UserRoundCheck,
            nota: '312 de 1.284 ações',
          },
        ]}
      />

      <BarraDaPrevia busca="Buscar na trilha" filtros={['Qualquer pessoa', 'Qualquer ação']} total={1284} />

      <Cartao
        icone={ScrollText}
        rotulo="Histórico de alterações"
        titulo="O que aconteceu na turma"
        descricao="As mudanças em pagamentos, acessos e registros da turma aparecem aqui. Este histórico não pode ser editado ou apagado."
      >
        <ol className="grid">
          {TRILHA.map((linha) => (
            <LinhaDeAuditoria key={linha.id} linha={linha} />
          ))}
        </ol>
      </Cartao>

      <RodapeDaPrevia total={1284} />
    </>
  )
}
