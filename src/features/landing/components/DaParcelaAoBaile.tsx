import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import pin from '@/assets/fotos/pin.webp'
import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { formatarCentavos } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { Coracao } from './Rabiscos'
import { SecaoDaLanding } from './SecaoDaLanding'

/**
 * "Da primeira reunião ao baile": o caminho até a festa numa trilha, no idioma do post 22 dos criativos
 * — fundo laranja, papel com percevejo, recado à mão e pontilhado ligando uma etapa à outra.
 *
 * Reúne agenda, mural e recibos em objetos dos criativos, sem repetir a vitrine de Recursos.
 * Arrecadações, relatório e mapa do salão ficam exportados para reutilização fora desta seção.
 */
export function DaParcelaAoBaile() {
  return (
    <SecaoDaLanding
      tom="laranja"
      titulo="Da primeira reunião"
      destaque="ao baile."
      nota="pra lembrar de cada detalhe até a festa"
      descricao="Das reuniões aos pagamentos: a turma acompanha as datas, os avisos e os recibos num lugar só."
      className="gap-14 lg:gap-16"
    >
      <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2 sm:gap-y-16 lg:grid-cols-3 lg:gap-x-28 lg:gap-y-20">
        <Etapa
          nota="todo mundo vê a mesma data"
          descricao="Reuniões, prova de beca e ensaio da colação na agenda da turma."
          trilha="alta"
        >
          <FolhaDaAgenda />
        </Etapa>

        <Etapa
          nota="sem sumir no grupo"
          descricao="Os avisos da comissão ficam no mural, fáceis de encontrar."
          trilha="baixa"
        >
          <AvisoDoMural />
        </Etapa>

        <Etapa
          nota="pagou? ficou registrado."
          descricao="A comissão confere o pagamento, e o recibo chega no e-mail do formando."
        >
          <ReciboDaParcela />
        </Etapa>
      </ol>
    </SecaoDaLanding>
  )
}

/**
 * Uma parada da trilha: o objeto, o recado à mão embaixo e, no desktop, o pontilhado até a próxima.
 *
 * O SVG cabe nos 112 px do vão da grade, com 8 px livres de cada lado: não entra nas ilustrações
 * nem nas legendas. A curva e a altura mudam em cada ligação; nas grades menores o traço some.
 */
function Etapa({
  nota,
  descricao,
  trilha,
  children,
}: {
  nota: string
  descricao: string
  trilha?: keyof typeof TRILHAS
  children: ReactNode
}) {
  return (
    <li className="relative grid min-w-0 content-start justify-items-center gap-5">
      <div className="grid w-full min-w-0 items-center justify-items-center px-2 py-3 sm:min-h-88 sm:py-0">
        {children}
      </div>
      <div className="grid max-w-72 justify-items-center gap-2 text-center">
        <h3 className="font-hand -rotate-2 text-2xl leading-tight sm:text-3xl">{nota}</h3>
        <p className="text-on-brand/90 text-sm leading-relaxed text-pretty">{descricao}</p>
      </div>
      {trilha ? (
        <svg
          viewBox="0 0 96 128"
          aria-hidden
          className={cn(
            'text-on-brand/90 pointer-events-none absolute left-full ml-2 hidden h-32 w-24 lg:block',
            TRILHAS[trilha].posicao,
          )}
        >
          <path
            d={TRILHAS[trilha].caminho}
            fill="none"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeDasharray="1 10"
          />
        </svg>
      ) : null}
    </li>
  )
}

const TRILHAS = {
  alta: { posicao: 'top-20', caminho: 'M3 112C12 22 63 8 93 66' },
  baixa: { posicao: 'top-48', caminho: 'M3 14C20 116 69 124 93 54' },
  subindo: { posicao: 'top-4', caminho: 'M3 114C70 118 24 8 93 12' },
  descendo: { posicao: 'top-52', caminho: 'M3 12C72 10 24 116 93 114' },
} as const

/** O recibo serrilhado do criativo 11, com o carimbo da conferência da tesouraria. */
function ReciboDaParcela() {
  return (
    <div className="bg-card text-foreground shadow-foto relative w-full max-w-64 -rotate-3 px-6 pt-6 pb-5">
      <div className="border-border flex items-baseline justify-between border-b border-dashed pb-4">
        <LogoKapa className="text-foreground h-7 w-auto" />
        <span className="text-muted-foreground text-[10px] tracking-widest uppercase">Recibo</span>
      </div>
      <p className="mt-4 text-xs font-medium">Mensalidade · 7/24</p>
      <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{formatarCentavos(40000)}</p>
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">Formanda</dt>
          <dd className="mt-0.5 font-medium">Ana Clara</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Forma de pagamento</dt>
          <dd className="mt-0.5 font-medium">PIX da turma</dd>
        </div>
      </dl>
      <p className="border-success-text text-success-text mt-5 -rotate-2 border px-2 py-2 text-center text-[11px]">
        Conferido pela comissão
      </p>
      <svg
        viewBox="0 0 256 12"
        preserveAspectRatio="none"
        aria-hidden
        className="fill-card absolute -bottom-3 left-0 h-3 w-full"
      >
        <path d="M0 0H256L248 12 240 0 232 12 224 0 216 12 208 0 200 12 192 0 184 12 176 0 168 12 160 0 152 12 144 0 136 12 128 0 120 12 112 0 104 12 96 0 88 12 80 0 72 12 64 0 56 12 48 0 40 12 32 0 24 12 16 0 8 12 0 0Z" />
      </svg>
    </div>
  )
}

const ARRECADACOES = [
  { origem: 'Rifa da turma', valor: 384000 },
  { origem: 'Festa de arrecadação', valor: 210000 },
  { origem: 'Patrocínio', valor: 150000 },
] as const

/** A lista aberta do criativo 08: os valores ficam sobre o fundo, ao lado do cofrinho. */
export function ArrecadacoesDaTurma() {
  return (
    <div className="relative w-full max-w-xs pt-2 pb-24">
      <p className="text-xs font-medium tracking-wide">Além das mensalidades</p>
      <dl className="divide-on-brand/40 mt-3 divide-y">
        {ARRECADACOES.map((entrada) => (
          <div key={entrada.origem} className="flex items-baseline justify-between gap-3 py-3">
            <dt className="text-sm">{entrada.origem}</dt>
            <dd className="shrink-0 text-base font-semibold tabular-nums">
              {formatarCentavos(entrada.valor)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="border-on-brand/40 border-t pt-3 pr-28">
        <span className="text-xs">Mais perto da festa</span>
        <strong className="mt-1 block text-2xl tracking-tight tabular-nums">
          {formatarCentavos(ARRECADACOES.reduce((total, entrada) => total + entrada.valor, 0))}
        </strong>
      </div>
      <img
        src={mascoteCofrinho}
        alt="Mascote do Kapa com cofrinho e calculadora"
        loading="lazy"
        width={400}
        height={400}
        className="absolute -right-2 -bottom-2 w-32 drop-shadow-lg"
      />
    </div>
  )
}

const MOVIMENTOS = [
  { origem: 'Parcelas', entrada: 1280000, saida: null },
  { origem: 'Arrecadações', entrada: 744000, saida: null },
  { origem: 'Buffet', entrada: null, saida: 1200000 },
  { origem: 'Fotografia', entrada: null, saida: 450000 },
] as const

/** Uma folha de prestação de contas, com colunas legíveis e o saldo anotado à mão. */
export function RelatorioDoMes() {
  const saldo = MOVIMENTOS.reduce(
    (total, movimento) => total + (movimento.entrada ?? 0) - (movimento.saida ?? 0),
    0,
  )

  return (
    <div className="bg-brand-wash text-foreground shadow-foto relative w-full max-w-xs rotate-2 px-4 pt-6 pb-4">
      <span
        className="border-muted-foreground/60 absolute -top-3 left-6 h-10 w-4 -rotate-12 rounded-full border-2"
        aria-hidden
      />
      <p className="text-brand-text text-xs font-semibold">Prestação de contas</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">Novembro · turma 2026</p>
      <table className="mt-4 w-full text-left text-[11px] tabular-nums">
        <caption className="sr-only">Exemplo de entradas e saídas do mês</caption>
        <thead>
          <tr className="border-border text-muted-foreground border-b">
            <th scope="col" className="pb-2 font-medium">
              Registro
            </th>
            <th scope="col" className="pb-2 text-right font-medium">
              Entrou
            </th>
            <th scope="col" className="pb-2 text-right font-medium">
              Saiu
            </th>
          </tr>
        </thead>
        <tbody>
          {MOVIMENTOS.map((movimento) => (
            <tr key={movimento.origem} className="border-border border-b">
              <th scope="row" className="py-2.5 font-normal">
                {movimento.origem}
              </th>
              <td className="py-2.5 text-right">{formatarCentavos(movimento.entrada)}</td>
              <td className="py-2.5 text-right">{formatarCentavos(movimento.saida)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="font-hand text-brand-text mt-3 -rotate-2 text-center text-2xl">
        saldo do mês: {formatarCentavos(saldo)}
      </p>
    </div>
  )
}

/** As mesas do salão: as tomadas em pêssego, as livres tracejadas e a 6 circulada à mão. */
const MESAS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const LIVRES = new Set([3, 7])

/** Ilustração do salão preservada para reutilização fora da trilha da landing. */
export function MapaDoSalao() {
  return (
    <div className="bg-card text-foreground shadow-foto relative w-60 -rotate-2 rounded-[4px] p-4">
      <img
        src={pin}
        alt=""
        className="absolute -top-5 left-1/2 z-10 size-10 -translate-x-1/2 rotate-6 drop-shadow-md"
      />
      <span className="bg-secondary text-muted-foreground mt-2 block rounded py-1 text-center text-[10px] font-semibold tracking-widest uppercase">
        Palco
      </span>
      <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3" aria-hidden>
        {MESAS.map((mesa) => (
          <span key={mesa} className="relative mx-auto grid size-11 place-items-center">
            <span
              className={cn(
                'grid size-10 place-items-center rounded-full text-xs font-semibold tabular-nums',
                LIVRES.has(mesa)
                  ? 'border-border text-muted-foreground border-2 border-dashed'
                  : 'bg-brand-tint text-brand-text',
                mesa === 6 && 'bg-brand text-on-brand',
              )}
            >
              {mesa}
            </span>
            {mesa === 6 ? (
              <svg
                viewBox="0 0 60 60"
                className="text-brand-hover absolute -inset-2 size-[3.75rem] overflow-visible"
              >
                <path
                  d="M30 4C46 3 57 15 56 31 55 47 43 57 28 56 13 55 3 44 4 29 5 15 17 6 34 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              </svg>
            ) : null}
          </span>
        ))}
      </div>
      <p className="font-hand text-brand-text mt-3 text-center text-xl leading-none">mesa da família</p>
    </div>
  )
}

/** As datas da turma, riscadas quando passam — a lista do post 03, agora com o que vem pela frente. */
const DATAS = [
  { data: '14/11', texto: 'prova de beca', feito: true },
  { data: '21/11', texto: 'reunião com o buffet', feito: true },
  { data: '05/12', texto: 'ensaio da colação', feito: false },
  { data: '12/12', texto: 'a festa!', feito: false },
] as const

/**
 * Folha de caderno: pauta, margem vermelha e letra à mão. A pauta é um gradiente repetido com a cor da
 * borda, e cada linha da lista tem a mesma altura da pauta para a letra sentar em cima do traço.
 */
function FolhaDaAgenda() {
  return (
    <div className="relative w-full max-w-sm">
      <div className="bg-brand-wash shadow-foto relative -rotate-1 overflow-hidden rounded-md pt-6 pb-8">
        <span className="bg-destructive/30 absolute inset-y-0 left-8 w-px" aria-hidden />
        <p className="font-hand text-brand-text pr-3 pl-11 text-3xl leading-[3rem]">Agenda da turma</p>
        <ul className="bg-[repeating-linear-gradient(to_bottom,var(--border)_0,var(--border)_1px,transparent_1px,transparent_3rem)]">
          {DATAS.map((item) => (
            <li key={item.data} className="flex h-12 items-center gap-2 pr-3 pl-1">
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-[5px] border-2',
                  item.feito ? 'border-foreground/60 text-success' : 'border-foreground/40',
                )}
                aria-hidden
              >
                {item.feito ? <Check className="size-5" strokeWidth={3.5} /> : null}
              </span>
              <span
                className={cn(
                  'font-hand min-w-0 text-xl leading-tight',
                  item.feito ? 'text-muted-foreground line-through' : 'text-foreground',
                )}
              >
                <span className="tabular-nums">{item.data}</span> · {item.texto}
              </span>
              {item.data === '12/12' ? <Coracao className="text-brand-hover size-5 shrink-0" /> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Um aviso da comissão preso no mural, como bilhete com percevejo. */
function AvisoDoMural() {
  return (
    <div className="relative w-full max-w-sm">
      <img
        src={pin}
        alt=""
        className="absolute -top-5 left-1/2 z-10 size-10 -translate-x-1/2 rotate-6 drop-shadow-md"
      />
      <div className="bg-card shadow-foto grid rotate-2 gap-3 rounded-md px-6 pt-9 pb-6">
        <span className="text-brand-text text-xs font-semibold">Mural · da comissão</span>
        <strong className="text-foreground text-xl leading-tight font-bold">Ensaio da colação</strong>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Sábado, 9h, no auditório central. Venham de beca, que é a última chance de ajustar a barra.
        </p>
        <span className="border-border text-muted-foreground border-t pt-3 text-xs">
          Ana Clara, presidente da comissão
        </span>
      </div>
    </div>
  )
}
