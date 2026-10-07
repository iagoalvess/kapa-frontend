import {
  Armchair,
  CalendarClock,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Clock,
  DoorOpen,
  Download,
  GraduationCap,
  Hourglass,
  Link2,
  List as IconeDeLista,
  Lock,
  Map as IconeDoMapa,
  MapPin,
  PartyPopper,
  Plus,
  ShoppingBag,
  Ticket,
  TicketCheck,
  UserRound,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { CartaoDeValor } from '@/components/CartaoDeValor'
import { Chip } from '@/components/Chip'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Selo, type TomDoSelo } from '@/components/Selo'
import { MapaDoSalao, type MesaNoMapa } from '@/features/festa/components/MapaDoSalao'
import { ListaDaPortaria } from '@/features/festa/components/ListaDaPortaria'
import type { ConviteNaPortaria } from '@/features/festa/types/convites.types'
import type { Mesa, PlantaDoSalao } from '@/features/festa/types/mesas.types'
import { ROTULOS_DA_COMPRA, type StatusDaCompra } from '@/features/loja/types/loja.types'
import { MEIOS_DE_PAGAMENTO, type MeioDePagamento } from '@/types/pagamento'
import { formatarCentavos, formatarDataHora } from '@/lib/formato'
import { BarraDaPrevia, RodapeDaPrevia, TabelaDaPrevia } from './ElementosDaPrevia'

/*
  As maquetes da festa ocupam o lugar da página quando o módulo está fora do plano (Sprint 45): a
  mesma estrutura da tela de verdade — faixa, filtros, tabela e laterais —, com dados de exemplo e
  sem montar consulta nenhuma. A página real nem chega a rodar, então nada aqui pode chamar hook de
  dados: é só apresentação, e o `<AreaBloqueada>` mantém tudo inerte e desfocado.
*/

const semAcao = () => undefined

/** Um convite na maquete de "Meus convites". */
interface ConviteDaMaquete {
  nome: string | null
  codigo: string
  documento: string | null
  evento: string
  quando: string
  situacao: { rotulo: string; tom: TomDoSelo }
  colacao: boolean
}

const CONVITES: ConviteDaMaquete[] = [
  {
    nome: 'Ana Beatriz Lima',
    codigo: 'KPA-4F2A9C',
    documento: 'CPF ••••1234',
    evento: 'Colação de grau',
    quando: '12/12/2026 · 19h · Auditório',
    situacao: { rotulo: 'Pronto', tom: 'sucesso' },
    colacao: true,
  },
  {
    nome: 'Bruno Alves Rocha',
    codigo: 'KPA-8B1D77',
    documento: 'RG ••••5678',
    evento: 'Festa de formatura',
    quando: '20/12/2026 · 22h · Espaço Aurora',
    situacao: { rotulo: 'Entrou', tom: 'sucesso' },
    colacao: false,
  },
  {
    nome: null,
    codigo: 'KPA-2C9E40',
    documento: null,
    evento: 'Colação de grau',
    quando: '12/12/2026 · 19h · Auditório',
    situacao: { rotulo: 'Sem nome', tom: 'neutro' },
    colacao: true,
  },
  {
    nome: 'Carla Menezes',
    codigo: 'KPA-7D3F18',
    documento: null,
    evento: 'Festa de formatura',
    quando: '20/12/2026 · 22h · Espaço Aurora',
    situacao: { rotulo: 'Falta o documento', tom: 'alerta' },
    colacao: false,
  },
  {
    nome: 'Diego Farias',
    codigo: 'KPA-1A5B92',
    documento: 'CPF ••••9012',
    evento: 'Colação de grau',
    quando: '12/12/2026 · 19h · Auditório',
    situacao: { rotulo: 'Pronto', tom: 'sucesso' },
    colacao: true,
  },
  {
    nome: 'Elisa Prado',
    codigo: 'KPA-6E8C31',
    documento: 'RG ••••3456',
    evento: 'Festa de formatura',
    quando: '20/12/2026 · 22h · Espaço Aurora',
    situacao: { rotulo: 'Pronto', tom: 'sucesso' },
    colacao: false,
  },
]

function BlocoDoConvidadoDaMaquete({ convite }: { convite: ConviteDaMaquete }) {
  return (
    <span className="flex items-center gap-3">
      <span
        className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${
          convite.colacao ? 'bg-avatar-4/20' : 'bg-avatar-3/20'
        }`}
      >
        {convite.colacao ? (
          <GraduationCap className="size-4.5" strokeWidth={1.75} aria-hidden />
        ) : (
          <PartyPopper className="size-4.5" strokeWidth={1.75} aria-hidden />
        )}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className="text-foreground font-medium break-words">
          {convite.nome ?? <span className="text-muted-foreground font-normal">Convidado a definir</span>}
        </span>
        <span className="text-muted-foreground font-mono text-xs">
          {convite.codigo}
          {convite.documento ? <span className="font-sans"> · {convite.documento}</span> : null}
        </span>
      </span>
    </span>
  )
}

/** "Meus convites" com a cota da colação e os convites comprados, como a tela real. */
export function PreviaDeConvites() {
  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo dos meus convites"
        indicadores={[
          { rotulo: 'Convites', valor: 6, icone: Ticket },
          { rotulo: 'Sem nome', valor: 1, icone: UserRound },
          { rotulo: 'Aguardando pagamento', valor: 2, icone: CalendarClock },
          { rotulo: 'A lista fecha', valor: '11/12 às 19h', icone: TicketCheck },
        ]}
      />

      <BarraDaPrevia
        busca="Buscar convidado"
        filtros={['Festa', 'Colação', 'Sem nome', 'Falta o documento', 'Pronto', 'Entrou']}
        acao="Pedir mais convites"
        total={6}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <TabelaDaPrevia
          titulo="Meus convites"
          colunas={['Convidado', 'Evento', 'Situação']}
          linhas={CONVITES.map((convite) => ({
            chave: convite.codigo,
            celulas: [
              <BlocoDoConvidadoDaMaquete key="convidado" convite={convite} />,
              <span key="evento" className="grid">
                <span className="text-foreground block">{convite.evento}</span>
                <span className="text-muted-foreground block text-xs">{convite.quando}</span>
              </span>,
              <Selo key="situacao" tom={convite.situacao.tom}>
                {convite.situacao.rotulo}
              </Selo>,
            ],
          }))}
        />

        <div className="hidden min-w-0 content-start gap-5 lg:grid">
          <CartaoDeValor
            titulo="Aguardando pagamento"
            destaque
            rotulo="Convites pedidos"
            valor="2"
            nota="Ainda estão sendo pagos. O convite sai quando a última parcela do pedido for confirmada."
            acao={<Button variant="outline">Ver meus pedidos</Button>}
          />

          <Cartao titulo="Nomear e enviar">
            <TextoDoCartao as="ul" className="divide-y">
              <li className="pb-3">
                Cada convite é de uma pessoa: o link aparece quando você dá o nome, e aí vai pelo WhatsApp.
              </li>
              <li className="py-3">Na entrada, a portaria confere o código e o documento do convidado.</li>
              <li className="pt-3">
                Dá para trocar o nome até 24 horas antes do evento. Depois, só com a comissão.
              </li>
            </TextoDoCartao>
          </Cartao>

          <Cartao
            titulo="Mais convites"
            descricao="Convites extras da festa se pedem como os outros opcionais."
          >
            <Button variant="outline" size="sm" className="justify-self-start">
              Ir para Meus pedidos
            </Button>
          </Cartao>
        </div>
      </div>

      <RodapeDaPrevia total={6} />
    </>
  )
}

const SALAO: PlantaDoSalao = {
  largura: 2400,
  altura: 1600,
  elementos: [
    { tipo: 'Palco', rotulo: 'Palco', x: 800, y: 0, largura: 800, altura: 260, cor: null },
    { tipo: 'Pista', rotulo: 'Pista de dança', x: 950, y: 700, largura: 500, altura: 500, cor: null },
    { tipo: 'Entrada', rotulo: 'Entrada', x: 100, y: 1500, largura: 200, altura: 60, cor: null },
    { tipo: 'Bar', rotulo: 'Bar', x: 2080, y: 300, largura: 320, altura: 140, cor: null },
    { tipo: 'Buffet', rotulo: 'Buffet', x: 0, y: 700, largura: 400, altura: 140, cor: null },
  ],
}

const MESAS: Mesa[] = [
  {
    id: 'm1',
    identificacao: 'Mesa 12',
    lugares: 8,
    observacao: null,
    reservada: false,
    vinculo_id: 'v1',
    dono: 'Família Souza',
    formato: 'Redonda',
    x: 420,
    y: 420,
    girada: false,
  },
  {
    id: 'm2',
    identificacao: 'Mesa 13',
    lugares: 10,
    observacao: null,
    reservada: false,
    vinculo_id: 'v2',
    dono: 'Família Lima',
    formato: 'Redonda',
    x: 900,
    y: 400,
    girada: false,
  },
  {
    id: 'm3',
    identificacao: 'Mesa 14',
    lugares: 8,
    observacao: null,
    reservada: false,
    vinculo_id: null,
    dono: null,
    formato: 'Redonda',
    x: 1500,
    y: 420,
    girada: false,
  },
  {
    id: 'm4',
    identificacao: 'Mesa 15',
    lugares: 8,
    observacao: null,
    reservada: false,
    vinculo_id: 'v3',
    dono: 'Família Castro',
    formato: 'Retangular',
    x: 400,
    y: 1200,
    girada: false,
  },
  {
    id: 'm5',
    identificacao: 'Mesa dos pais',
    lugares: 10,
    observacao: null,
    reservada: true,
    vinculo_id: null,
    dono: null,
    formato: 'Retangular',
    x: 1900,
    y: 300,
    girada: true,
  },
  {
    id: 'm6',
    identificacao: 'Mesa 17',
    lugares: 8,
    observacao: 'Ainda sem lugar no salão',
    reservada: false,
    vinculo_id: null,
    dono: null,
    formato: 'Redonda',
    x: null,
    y: null,
    girada: false,
  },
]

const MESAS_NO_MAPA: MesaNoMapa[] = MESAS.filter(
  (mesa): mesa is Mesa & { x: number; y: number } => mesa.x !== null && mesa.y !== null,
).map((mesa) => ({
  id: mesa.id,
  identificacao: mesa.identificacao,
  lugares: mesa.lugares,
  formato: mesa.formato,
  girada: mesa.girada,
  x: mesa.x,
  y: mesa.y,
  tom: mesa.reservada ? 'reservada' : mesa.vinculo_id ? 'dono' : 'livre',
  legenda: mesa.reservada ? 'Reservada' : mesa.dono,
}))

const COMPRADORES = [
  { vinculo_id: 'v1', nome: 'Família Souza', compradas: 2, atribuidas: 1 },
  { vinculo_id: 'v2', nome: 'Família Lima', compradas: 1, atribuidas: 1 },
  { vinculo_id: 'v3', nome: 'Família Castro', compradas: 1, atribuidas: 1 },
]

/** As mesas do jantar: o mapa do salão e a lista, como a comissão as vê (Sprint 27). */
export function PreviaDeMesas() {
  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo das mesas"
        indicadores={[
          { rotulo: 'Mesas', valor: 32, nota: '29 com dono', icone: Armchair },
          { rotulo: 'Lugares', valor: 256, icone: Armchair },
          { rotulo: 'Reservadas', valor: 3, icone: Lock },
          { rotulo: 'Compradas sem mesa', valor: 5, icone: ShoppingBag },
        ]}
      />

      <div className="flex gap-2">
        <Chip tom="claro" ativo>
          <IconeDoMapa aria-hidden className="size-4" />
          Mapa
        </Chip>
        <Chip tom="claro" ativo={false}>
          <IconeDeLista aria-hidden className="size-4" />
          Lista
        </Chip>
      </div>

      <Cartao
        titulo="Mapa do salão"
        icone={IconeDoMapa}
        descricao="Arraste as mesas e monte o salão: palco, pista, entrada e o que mais houver. A turma vê onde fica a própria mesa."
        acao={
          <Button variant="outline" size="sm">
            <Plus aria-hidden />
            Nova mesa
          </Button>
        }
      >
        <div className="bg-background overflow-auto rounded-2xl border p-3">
          <MapaDoSalao salao={SALAO} mesas={MESAS_NO_MAPA} rotulo="Mapa do salão" />
        </div>
      </Cartao>

      <TabelaDaPrevia
        titulo="Mesas"
        colunas={['Mesa', 'Lugares', 'Dono']}
        linhas={MESAS.map((mesa) => ({
          chave: mesa.id,
          celulas: [
            <span key="mesa" className="grid min-w-24">
              <span className="text-foreground font-medium">{mesa.identificacao}</span>
              {mesa.observacao ? (
                <span className="text-muted-foreground text-xs font-normal">{mesa.observacao}</span>
              ) : null}
            </span>,
            <span key="lugares" className="block text-right tabular-nums">
              {mesa.lugares}
            </span>,
            mesa.reservada ? (
              <Selo key="dono">Reservada</Selo>
            ) : (
              <span key="dono">{mesa.dono ?? <span className="text-muted-foreground">Sem dono</span>}</span>
            ),
          ],
        }))}
      />

      <TabelaDaPrevia
        titulo="Quem comprou mesa"
        colunas={['Formando', 'Compradas', 'No mapa']}
        linhas={COMPRADORES.map((comprador) => ({
          chave: comprador.vinculo_id,
          celulas: [
            <span key="formando" className="text-foreground">
              {comprador.nome}
            </span>,
            <span key="compradas" className="block text-right tabular-nums">
              {comprador.compradas}
            </span>,
            <span key="mapa" className="block text-right tabular-nums">
              {comprador.atribuidas < comprador.compradas ? (
                <Selo tom="alerta">
                  {comprador.atribuidas} de {comprador.compradas}
                </Selo>
              ) : (
                comprador.atribuidas
              )}
            </span>,
          ],
        }))}
      />
    </>
  )
}

const CONVITES_DA_PORTARIA: ConviteNaPortaria[] = [
  {
    id: 'p1',
    evento_id: 'ev-festa',
    codigo: 'KPA-4F2A9C',
    nome_do_convidado: 'Ana Beatriz Lima',
    documento: 'CPF ••••1234',
    convidado_de: 'Marina Costa',
    origem: 'Comprado',
    situacao: 'Validado',
    motivo_da_revogacao: null,
    entrada: {
      check_in_id: 'ck-1',
      validado_em: '2026-12-20T22:41:00Z',
      validado_por: 'Portaria',
      validado_por_usuario_id: 'u-portaria',
    },
    entrou_sem_rede_duas_vezes: false,
    observacoes: null,
  },
  {
    id: 'p2',
    evento_id: 'ev-festa',
    codigo: 'KPA-8B1D77',
    nome_do_convidado: 'Bruno Alves Rocha',
    documento: 'RG ••••5678',
    convidado_de: 'Rafael Almeida',
    origem: 'Comprado',
    situacao: 'Valido',
    motivo_da_revogacao: null,
    entrada: null,
    entrou_sem_rede_duas_vezes: false,
    observacoes: null,
  },
  {
    id: 'p3',
    evento_id: 'ev-festa',
    codigo: 'KPA-2C9E40',
    nome_do_convidado: null,
    documento: null,
    convidado_de: null,
    origem: 'Pacote',
    situacao: 'SemTitular',
    motivo_da_revogacao: null,
    entrada: null,
    entrou_sem_rede_duas_vezes: false,
    observacoes: null,
  },
  {
    id: 'p4',
    evento_id: 'ev-festa',
    codigo: 'KPA-7D3F18',
    nome_do_convidado: 'Carla Menezes',
    documento: 'CPF ••••9012',
    convidado_de: 'Marina Costa',
    origem: 'Cortesia',
    situacao: 'Valido',
    motivo_da_revogacao: null,
    entrada: null,
    entrou_sem_rede_duas_vezes: false,
    observacoes: null,
  },
  {
    id: 'p5',
    evento_id: 'ev-festa',
    codigo: 'KPA-1A5B92',
    nome_do_convidado: 'Diego Farias',
    documento: 'RG ••••3456',
    convidado_de: 'Rafael Almeida',
    origem: 'Comprado',
    situacao: 'Revogado',
    motivo_da_revogacao: 'Convite reemitido',
    entrada: null,
    entrou_sem_rede_duas_vezes: false,
    observacoes: null,
  },
  {
    id: 'p6',
    evento_id: 'ev-festa',
    codigo: 'KPA-6E8C31',
    nome_do_convidado: 'Elisa Prado',
    documento: 'CPF ••••3344',
    convidado_de: 'Marina Costa',
    origem: 'Loja',
    situacao: 'Validado',
    motivo_da_revogacao: null,
    entrada: {
      check_in_id: 'ck-2',
      validado_em: '2026-12-20T23:05:00Z',
      validado_por: 'Portaria',
      validado_por_usuario_id: 'u-portaria',
    },
    entrou_sem_rede_duas_vezes: false,
    observacoes: null,
  },
]

/** A portaria da festa: a contagem, a lista de convidados e os cartões laterais (P4 da Sprint 21). */
export function PreviaDePortaria() {
  return (
    <>
      <FaixaDeIndicadores
        rotulo="Contagem da portaria"
        indicadores={[
          { rotulo: 'Entraram', valor: 128, icone: CircleCheck },
          { rotulo: 'Convites válidos', valor: 212, icone: Ticket },
          { rotulo: 'Faltam entrar', valor: 84, icone: DoorOpen },
          { rotulo: 'Sem nome ou documento', valor: 6, icone: UserRound },
        ]}
      />

      <BarraDaPrevia
        busca="Procurar convidado"
        filtros={['Festa', 'Colação', 'Válido', 'Sem titular', 'Entrou', 'Revogado']}
        acao="Nova cortesia"
        total={212}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <ListaDaPortaria
          convites={CONVITES_DA_PORTARIA}
          visiveis={CONVITES_DA_PORTARIA}
          paginaNaUrl={1}
          janelaAberta
          offline={false}
          editavel
          marcadoSemRede={() => false}
          conviteAberto={null}
          aoDetalhar={semAcao}
          aoValidar={semAcao}
          aoMarcarSemRede={semAcao}
          aoEditar={semAcao}
          aoReemitir={semAcao}
          aoMudarPagina={semAcao}
        />

        <div className="hidden min-w-0 content-start gap-5 lg:grid">
          <Cartao titulo="Festa de formatura">
            <ListaDeDados>
              <Dado icone={CalendarDays} rotulo="Quando">
                20/12/2026 às 22:00
              </Dado>
              <Dado icone={MapPin} rotulo="Onde">
                Espaço Aurora &middot; São Paulo
              </Dado>
              <Dado icone={Clock} rotulo="Lista gerada em">
                20/12/2026, 20:12
              </Dado>
            </ListaDeDados>
          </Cartao>

          <Cartao
            titulo="Exportar lista"
            descricao="Baixe a lista em PDF e leve para a porta — papel não fica sem bateria nem sem sinal."
          >
            <Button>
              <Download aria-hidden />
              Baixar lista em PDF
            </Button>
          </Cartao>
        </div>
      </div>
    </>
  )
}

interface CompraDaMaquete {
  comprador: string
  email: string | null
  cpf: string | null
  item: string
  quantidade: number
  total: number
  meio: MeioDePagamento
  comprouEm: string
  status: StatusDaCompra
  pagadorDiferente?: boolean
  pediuCancelamento?: boolean
  aDevolver?: number
}

const COMPRAS: CompraDaMaquete[] = [
  {
    comprador: 'Sônia Ribeiro',
    email: 'sonia.ribeiro@email.com',
    cpf: 'CPF ••••1020',
    item: 'Convite adulto',
    quantidade: 2,
    total: 26000,
    meio: 'Pix',
    comprouEm: '2026-12-18T14:22:00Z',
    status: 'Paga',
  },
  {
    comprador: 'Marcos Tavares',
    email: 'marcos.t@email.com',
    cpf: 'CPF ••••3040',
    item: 'Convite adulto',
    quantidade: 1,
    total: 13000,
    meio: 'Pix',
    comprouEm: '2026-12-18T15:03:00Z',
    status: 'Pendente',
  },
  {
    comprador: 'Luciana Prado',
    email: null,
    cpf: null,
    item: 'Convite infantil',
    quantidade: 3,
    total: 19500,
    meio: 'Cartao',
    comprouEm: '2026-12-17T19:47:00Z',
    status: 'Paga',
    pagadorDiferente: true,
  },
  {
    comprador: 'Paulo Mendes',
    email: 'paulo.mendes@email.com',
    cpf: 'CPF ••••5060',
    item: 'Convite adulto',
    quantidade: 2,
    total: 26000,
    meio: 'Pix',
    comprouEm: '2026-12-16T11:10:00Z',
    status: 'ADevolver',
    pediuCancelamento: true,
    aDevolver: 26000,
  },
  {
    comprador: 'Renata Lopes',
    email: 'renata.lopes@email.com',
    cpf: 'CPF ••••7080',
    item: 'Convite adulto',
    quantidade: 4,
    total: 52000,
    meio: 'Pix',
    comprouEm: '2026-12-15T09:30:00Z',
    status: 'Paga',
  },
]

const TOM_DA_COMPRA: Record<StatusDaCompra, TomDoSelo> = {
  Pendente: 'alerta',
  Paga: 'sucesso',
  Expirada: 'neutro',
  ADevolver: 'perigo',
  Devolvida: 'neutro',
}

/** As compras da loja pública, como a Gestão as acompanha para devolver (Sprint 26). */
export function PreviaDeCompras() {
  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo da loja"
        indicadores={[
          { rotulo: 'Convites vendidos', valor: 96, icone: Ticket },
          { rotulo: 'Aguardando PIX', valor: 4, nota: 'lugares presos por até 30 min', icone: Hourglass },
          {
            rotulo: 'A devolver',
            valor: 2,
            nota: 'canceladas ou pagas sem lugar',
            icone: CircleAlert,
          },
          { rotulo: 'Arrecadado', valor: formatarCentavos(7480000), icone: Wallet },
        ]}
      />

      <BarraDaPrevia
        busca="Buscar comprador ou e-mail"
        filtros={['Aguardando pagamento', 'Paga', 'Expirada', 'A devolver', 'Devolvida']}
        acao="Planilha"
        total={96}
      />

      <Cartao
        titulo="Pedidos de cancelamento"
        icone={CircleAlert}
        descricao="Os convites continuam valendo até a comissão responder."
      >
        <ul className="grid gap-2">
          <li className="flex items-center gap-3 rounded-xl border p-3 text-sm">
            <div className="grid min-w-0 flex-1">
              <span className="font-medium">Paulo Mendes</span>
              <span className="text-muted-foreground text-xs">
                2 de 2 convites &middot; Convite adulto &middot; pedido em 17/12/2026, 08:12
              </span>
              <span className="text-xs">&ldquo;Não vou mais poder ir.&rdquo;</span>
            </div>
          </li>
        </ul>
      </Cartao>

      <TabelaDaPrevia
        titulo="Compras da loja"
        colunas={['Comprador', 'Convite', 'Total', 'Meio', 'Comprou em', 'Situação']}
        linhas={COMPRAS.map((compra) => ({
          chave: `${compra.comprador}-${compra.comprouEm}`,
          celulas: [
            <span key="comprador" className="grid">
              <span className="text-foreground font-medium">{compra.comprador}</span>
              {compra.email ? <span className="text-muted-foreground text-xs">{compra.email}</span> : null}
              {compra.cpf ? <span className="text-texto-muted text-xs">{compra.cpf}</span> : null}
            </span>,
            <span key="convite">
              {compra.quantidade}&times; {compra.item}
            </span>,
            <span key="total" className="block text-right tabular-nums">
              {formatarCentavos(compra.total)}
            </span>,
            <span key="meio">{MEIOS_DE_PAGAMENTO[compra.meio].rotulo}</span>,
            <span key="comprou" className="whitespace-nowrap">
              {formatarDataHora(compra.comprouEm)}
            </span>,
            <span key="situacao" className="flex flex-wrap gap-1">
              <Selo tom={TOM_DA_COMPRA[compra.status]}>{ROTULOS_DA_COMPRA[compra.status]}</Selo>
              {compra.pagadorDiferente ? <Selo tom="alerta">Pagou outro CPF</Selo> : null}
              {compra.pediuCancelamento ? <Selo tom="alerta">Pediu cancelamento</Selo> : null}
              {compra.aDevolver ? (
                <span className="text-danger-text w-full text-xs">
                  {formatarCentavos(compra.aDevolver)} a devolver
                </span>
              ) : null}
            </span>,
          ],
        }))}
      />

      <Cartao
        titulo="Divulgar a loja"
        descricao="Copie o link e mande no grupo da turma: é por ele que a loja abre para quem vai comprar."
        className="hidden lg:grid"
      >
        <Button variant="outline" size="sm" className="justify-self-start">
          <Link2 aria-hidden />
          Copiar link da loja
        </Button>
      </Cartao>
    </>
  )
}
