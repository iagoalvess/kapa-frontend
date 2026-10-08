import { Check, FileText, Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import pin from '@/assets/fotos/pin.webp'
import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import { formatarCentavos } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { Coracao } from './Rabiscos'
import { SecaoDaLanding } from './SecaoDaLanding'

/**
 * "Da primeira reunião ao baile": o caminho até a festa numa trilha, no idioma do post 22 dos criativos
 * — fundo laranja, papel com percevejo, recado à mão e pontilhado ligando uma etapa à outra.
 *
 * Reúne agenda, mural e documentos em objetos dos criativos, sem repetir a vitrine de Recursos.
 * Arrecadações, relatório e mapa do salão ficam exportados para reutilização fora desta seção.
 */
export function DaParcelaAoBaile() {
  return (
    <SecaoDaLanding
      tom="laranja"
      titulo="Da primeira reunião"
      destaque="ao baile."
      nota="pra lembrar de cada detalhe até a festa"
      descricao="Das reuniões aos pagamentos: a turma acompanha as datas, os avisos e os documentos num lugar só."
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
          nota="o contrato não some no grupo"
          descricao="Contratos, atas e orçamentos guardados num lugar só, para a turma consultar quando precisar."
        >
          <PastaDeDocumentos />
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

/** O acervo da turma, separado por gaveta como no app; o orçamento mostra o que fica só com a comissão. */
const DOCUMENTOS = [
  { nome: 'Contrato do buffet', gaveta: 'Contrato', soDaComissao: false },
  { nome: 'Ata da reunião de 21/11', gaveta: 'Ata', soDaComissao: false },
  { nome: 'Orçamento da fotografia', gaveta: 'Orçamento', soDaComissao: true },
] as const

/**
 * Uma pasta de papel aberta: a aba com o nome atrás, o contrato saindo por cima com o carimbo, e a
 * capa da frente com a lista do acervo.
 */
function PastaDeDocumentos() {
  return (
    <div className="relative w-full max-w-sm pt-4">
      <div className="bg-brand-tint shadow-foto relative -rotate-2 rounded-md rounded-tl-none px-4 pt-6 pb-40">
        <span className="bg-brand-tint absolute -top-6 left-0 rounded-t-md px-4 pt-1.5 pb-1">
          <span className="font-hand text-brand-text text-xl leading-none">Pasta da turma</span>
        </span>
        <div className="bg-card text-foreground relative rotate-3 rounded-[3px] px-4 pt-4 pb-10 shadow-sm">
          <span className="text-brand-text text-[10px] font-semibold tracking-widest uppercase">
            Contrato
          </span>
          <p className="mt-1 text-base font-bold">Buffet Vista Verde</p>
          <div className="mt-3 grid gap-1.5" aria-hidden>
            <span className="bg-secondary h-1 w-full rounded-full" />
            <span className="bg-secondary h-1 w-11/12 rounded-full" />
            <span className="bg-secondary h-1 w-3/4 rounded-full" />
          </div>
          <p className="border-success-text text-success-text absolute right-4 bottom-3 rotate-6 border px-2 py-1 text-[10px]">
            Assinado
          </p>
        </div>
      </div>
      <div className="bg-brand-wash shadow-foto absolute inset-x-0 bottom-0 rotate-1 rounded-md px-4 pt-3 pb-4">
        <ul className="divide-border text-foreground grid divide-y">
          {DOCUMENTOS.map((documento) => (
            <li key={documento.nome} className="flex items-center gap-2.5 py-2">
              <FileText className="text-brand-text size-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{documento.nome}</span>
              <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-[11px]">
                {documento.soDaComissao ? <Lock className="size-3" aria-hidden /> : null}
                {documento.soDaComissao ? 'Só a comissão' : documento.gaveta}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
