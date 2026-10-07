import { Camera, Check, Flower2, Heart, MapPin, ShieldCheck, Utensils } from 'lucide-react'
import type { ReactNode } from 'react'
import avatarAna from '@/assets/avatares/ana-clara.webp'
import avatarBruno from '@/assets/avatares/bruno-lima.webp'
import avatarCarla from '@/assets/avatares/carla-souza.webp'
import fotoDoBaile from '@/assets/fotos/baile.webp'
import qrcode from '@/assets/outros/qrcode.webp'
import carteira from '@/assets/outros/carteira.webp'
import { Folha } from '@/components/Folha'
import { cn } from '@/lib/utils'
import { SecaoDaLanding } from './SecaoDaLanding'
import { MetaDaTurmaAnimada } from './MetaDaTurmaAnimada'

/**
 * Mantém a grade 2–1–1 / 1–1–2 e reserva o mesmo espaço para cada maquete.
 *
 * No celular a grade vira o "bento" do Visor (28/09/2026): o cartão `largo` ocupa a linha, os outros
 * vêm dois por linha, com a maquete reduzida (`zoom`), o título centralizado e sem o texto de apoio.
 *
 * @param className A ordem no celular, para as cores se alternarem em xadrez.
 */
function Cartao({
  titulo,
  texto,
  largo = false,
  tom = 'creme',
  tituloPrimeiro = false,
  className,
  maqueteClassName,
  children,
}: {
  titulo: string
  texto: string
  largo?: boolean
  tom?: 'creme' | 'destaque'
  tituloPrimeiro?: boolean
  className?: string
  maqueteClassName?: string
  children: ReactNode
}) {
  return (
    <li
      className={cn(
        'cartao-ao-rolar group shadow-vitrine hover:shadow-vitrine-hover relative flex min-w-0 flex-col justify-between gap-3 overflow-hidden rounded-3xl border p-4 transition-shadow max-sm:p-3 sm:min-h-52',
        // A seção é o creme; o cartão é o claro do hero. Chapado, porque um degradê que terminasse
        // no creme faria o canto do cartão sumir no fundo.
        tom === 'creme' && 'border-brand-tint/70 bg-background',
        tom === 'destaque' && 'border-primary bg-primary',
        largo && 'max-sm:col-span-2 lg:col-span-2',
        className,
      )}
    >
      <div
        className={cn(
          // A maquete cresce com a linha da grade: um vizinho mais alto não abre buraco entre ela e o texto.
          'relative flex min-h-36 min-w-0 flex-1 items-center',
          !largo && 'max-sm:[zoom:0.7]',
          maqueteClassName,
        )}
      >
        {children}
      </div>
      <div
        className={cn('relative grid gap-1', tituloPrimeiro && 'order-first', !largo && 'max-sm:text-center')}
      >
        <h3
          className={cn(
            'font-semibold tracking-tight',
            tom === 'destaque' ? 'text-primary-foreground' : 'text-foreground',
          )}
        >
          {titulo}
        </h3>
        <p
          className={cn(
            'text-xs leading-relaxed text-pretty',
            !largo && 'max-sm:hidden',
            tom === 'destaque' ? 'text-primary-foreground/90' : 'text-muted-foreground',
          )}
        >
          {texto}
        </p>
      </div>
    </li>
  )
}

const PARCELAS = [
  { nome: 'Ana Clara', parcela: '2/12', valor: 'R$ 256,23', avatar: avatarAna, progresso: 'w-1/6' },
  { nome: 'Bruno Lima', parcela: '5/12', valor: 'R$ 256,23', avatar: avatarBruno, progresso: 'w-5/12' },
  { nome: 'Carla Souza', parcela: '12/12', valor: null, avatar: avatarCarla, progresso: 'w-full' },
]

function MaqueteDeParcelas() {
  return (
    <div className="grid w-full grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] items-center gap-2 lg:gap-3">
      <div className="grid gap-1.5">
        {PARCELAS.map((parcela) => (
          <div
            key={parcela.nome}
            className="bg-card flex min-w-0 items-center gap-1.5 rounded-lg px-1.5 py-2 shadow-sm lg:gap-2 lg:px-2.5"
          >
            <img
              src={parcela.avatar}
              alt=""
              loading="lazy"
              width={28}
              height={28}
              className="size-5 shrink-0 rounded-full object-cover lg:size-7"
            />
            <div className="grid min-w-0 flex-1 gap-1.5">
              <span className="text-foreground text-[8px] font-medium whitespace-nowrap lg:text-[11px]">
                {parcela.nome}
              </span>
              <span className="bg-secondary h-1 overflow-hidden rounded-full" aria-hidden>
                <span
                  className={cn(
                    'bg-success crescer-ao-rolar block h-full origin-left rounded-full',
                    parcela.progresso,
                  )}
                />
              </span>
            </div>
            <div className="grid shrink-0 justify-items-end gap-1 text-[8px] leading-tight lg:text-[10px]">
              {parcela.valor ? (
                <span className="text-foreground font-medium tabular-nums">{parcela.valor}</span>
              ) : (
                <span className="text-success-text flex items-center gap-0.5 font-semibold">
                  <Check className="size-2.5" strokeWidth={3} aria-hidden />
                  Em dia
                </span>
              )}
              <span className="text-muted-foreground tabular-nums">{parcela.parcela}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="grid">
        <span className="bg-primary text-primary-foreground relative z-10 -mb-1 block rounded-lg px-1.5 py-2.5 text-center text-[9px] leading-tight font-semibold shadow-sm lg:text-[11px]">
          Pagar selecionadas
        </span>
        <div
          className="bg-card grid gap-3 rounded-lg px-2.5 pt-3.5 pb-2.5 shadow-sm lg:px-3 lg:pt-4 lg:pb-3"
          aria-hidden
        >
          {[0, 1, 2].map((indice) => (
            <div key={indice} className="flex items-center gap-2">
              <span className="bg-brand-tint text-brand-text grid size-4 shrink-0 place-items-center rounded">
                <Check
                  className="motion-safe:animate-surgir-em-loop size-3"
                  strokeWidth={3}
                  style={{ animationDelay: `${indice * 0.5}s` }}
                />
              </span>
              <span className={cn('bg-secondary h-1.5 rounded-full', indice === 2 ? 'w-2/3' : 'w-full')} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MaqueteDePagamento() {
  return (
    <div className="w-full space-y-2">
      <div className="bg-card border-border/60 flex items-center gap-3 rounded-2xl border p-3 shadow-sm">
        <img src={qrcode} alt="" loading="lazy" className="size-16 shrink-0 rounded-md" />
        <div className="grid min-w-0 gap-1">
          <span className="text-brand-text text-[10px] font-semibold">PIX · Cartão · Dinheiro</span>
          <span className="text-foreground text-xs font-bold">
            Direto na conta
            <br />
            da comissão
          </span>
        </div>
      </div>
      <div className="bg-success-bg text-success-text flex items-center gap-2 rounded-xl px-3 py-2">
        <span className="bg-success text-card grid size-5 shrink-0 place-items-center rounded-full">
          <Check className="motion-safe:animate-surgir-em-loop size-3" strokeWidth={3} aria-hidden />
        </span>
        <span className="grid gap-0.5 text-[10px]">
          <strong className="font-semibold">Pagamento conferido</strong>
          <span>R$ 256,23 · Ana Clara</span>
        </span>
      </div>
    </div>
  )
}

function MaqueteDoTermo() {
  return (
    <div className="relative flex h-full w-full items-center justify-center px-3 pb-4">
      <div className="bg-brand-tint/70 absolute inset-x-7 top-3 bottom-5 rotate-3 rounded-xl" aria-hidden />
      <div className="motion-safe:animate-flutuar-devagar relative w-full">
        <div className="bg-card border-border/70 grid -rotate-3 gap-2 rounded-xl border p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-foreground text-[11px] font-semibold">Termo de adesão</span>
            <span className="bg-brand-tint text-brand-text rounded-md px-1.5 py-0.5 text-[9px] font-semibold">
              v2.1
            </span>
          </div>
          <div className="grid gap-1.5" aria-hidden>
            <span className="bg-secondary h-1 w-full rounded-full" />
            <span className="bg-secondary h-1 w-11/12 rounded-full" />
            <span className="bg-secondary h-1 w-2/3 rounded-full" />
          </div>
          <div className="border-border/70 flex items-center justify-between border-t pt-1.5">
            <span className="font-hand text-foreground text-lg leading-none">Ana Clara</span>
            <span className="text-success-text flex items-center gap-1 text-[9px]">
              <ShieldCheck className="size-3" aria-hidden />
              Assinado
            </span>
          </div>
        </div>
      </div>
      <p className="bg-card text-success-text absolute right-0 bottom-0 flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] shadow-sm">
        <Check className="size-3" strokeWidth={3} aria-hidden />
        <strong className="font-semibold">124 aderiram</strong>
        <span className="text-muted-foreground">· 8 pendentes</span>
      </p>
    </div>
  )
}

const DESPESAS = [
  { rotulo: 'Buffet', valor: 'R$ 12.000', icone: Utensils },
  { rotulo: 'Fotografia', valor: 'R$ 4.500', icone: Camera },
  { rotulo: 'Decoração', valor: 'R$ 3.200', icone: Flower2 },
]

/** A lista e o saldo anotados numa folha, como nos recados dos criativos. */
function MaqueteDeDespesas() {
  return (
    <div className="relative grid w-full gap-3 pr-6">
      <div className="bg-card shadow-foto border-brand-soft grid -rotate-2 gap-2 rounded-[2px] border-l-2 px-3 py-2">
        <dl className="divide-border text-foreground grid divide-y">
          {DESPESAS.map((despesa) => (
            <div key={despesa.rotulo} className="flex items-center gap-2 py-1.5">
              <despesa.icone className="text-brand-text size-3.5 shrink-0" aria-hidden />
              <dt className="flex-1 text-[10px]">{despesa.rotulo}</dt>
              <dd className="text-[10px] font-medium whitespace-nowrap tabular-nums">{despesa.valor}</dd>
            </div>
          ))}
        </dl>
        <div className="border-border border-t pt-2">
          <span className="font-hand text-brand-text text-lg leading-none">Deve sobrar para a festa</span>
          <strong className="text-success-text mt-1 block text-2xl leading-none font-bold tracking-tight tabular-nums">
            R$ 18.360
          </strong>
        </div>
      </div>
      <img
        src={carteira}
        alt=""
        loading="lazy"
        className="motion-safe:animate-flutuar-devagar absolute -right-2 -bottom-2 w-12 drop-shadow-sm"
      />
    </div>
  )
}

function MaqueteDaRegua() {
  return (
    <div className="relative mx-auto flex h-full w-full max-w-64 items-center justify-center pr-7">
      <div className="bg-card shadow-flutuante relative w-[164px] -rotate-6 rounded-[20px] px-3.5 py-2.5">
        <div className="motion-safe:animate-flutuar-devagar relative mx-auto mb-1.5 h-8 w-10" aria-hidden>
          <svg viewBox="0 0 48 36" className="size-full overflow-visible drop-shadow-sm">
            <rect x="3" y="5" width="40" height="27" rx="3" className="fill-ilustracao-envelope" />
            <path d="M4 7 23 23 42 7" className="fill-ilustracao-envelope-lacre" />
            <path
              d="m4 31 14-13m24 13L28 18"
              fill="none"
              className="stroke-ilustracao-envelope-dobra"
              strokeWidth="2"
            />
            <path d="M4 6 23 18 42 6" className="fill-ilustracao-envelope-aba" />
          </svg>
          <span className="bg-destructive text-destructive-foreground ring-card absolute -top-0.5 -right-1 grid size-4 place-items-center rounded-full text-[9px] ring-2">
            1
          </span>
        </div>
        <p className="text-foreground text-[10px] leading-[1.35] font-semibold">
          Oi, seu pagamento
          <br />
          está em aberto!
        </p>
        <p className="text-muted-foreground mt-1 text-[9px] leading-[1.3]">
          Esta é sua lembrança da parcela de Setembro/2026.
        </p>
        <span className="border-border text-foreground mt-2 block rounded-lg border py-1 text-center text-[9px] leading-none">
          Ver detalhes
        </span>
      </div>
      <svg
        viewBox="0 0 48 80"
        className="motion-safe:animate-flutuar text-ilustracao-coral absolute top-0 right-0 h-16 w-10"
        aria-hidden
      >
        <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="m9 18-1-10M22 12l4-9M33 21l10-8" />
        </g>
        <path
          d="m4 43 39-12-12 37-10-12-10 6 3-15Z"
          fill="currentColor"
          className="stroke-card"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="m15 47 18-9-12 18" className="fill-ilustracao-coral-claro" />
      </svg>
    </div>
  )
}

/** A foto do baile presa com fita ao lado da página do caderno, onde a festa e a meta estão anotadas. */
function MaqueteDaFesta() {
  return (
    <div className="relative grid h-full w-full grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-center gap-3 px-1 pt-2">
      <figure className="bg-card shadow-foto relative z-10 -rotate-6 p-2 pb-1">
        <span
          aria-hidden
          className="bg-brand-soft/70 absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 rotate-6"
        />
        <img src={fotoDoBaile} alt="" loading="lazy" className="h-24 w-full object-cover sm:h-28" />
        <figcaption className="font-hand text-brand-text flex justify-center gap-1 py-1 text-sm leading-none">
          a gente chega lá <Heart className="size-3" aria-hidden />
        </figcaption>
      </figure>
      <Folha prende="espiral" pautada compacto className="grid min-w-0 rotate-2 pt-6 pr-3 pb-5">
        <p className="font-hand text-brand-text text-xl leading-5 max-sm:hidden">Anota aí: a nossa festa!</p>
        <div className="flex items-center gap-2">
          <span className="font-hand text-brand-text text-3xl leading-10">12</span>
          <div className="grid min-w-0 text-[9px] leading-5">
            <span className="text-foreground font-semibold">dezembro de 2026</span>
            <span className="text-muted-foreground flex items-start gap-1">
              <MapPin className="text-brand-text size-2.5 shrink-0" aria-hidden />
              Espaço Vista Verde
            </span>
          </div>
        </div>
        <MetaDaTurmaAnimada />
      </Folha>
    </div>
  )
}

/** Maquetes em DOM, com a paleta, as cartas e a fotografia do mural do Hero. */
export function Recursos() {
  return (
    <SecaoDaLanding
      id="recursos"
      tom="creme"
      className="gap-10"
      titulo="Sua turma inteira"
      destaque="em dia."
      nota="quem já pagou e quanto falta para a festa"
      descricao="A comissão organiza as parcelas e os gastos. Cada formando acompanha seus pagamentos e assina o termo pelo celular."
    >
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Cartao
          largo
          tituloPrimeiro
          titulo="Cobranças e parcelas"
          texto="Cada formando acompanha as próprias parcelas e pode pagar várias de uma vez."
        >
          <MaqueteDeParcelas />
        </Cartao>
        <Cartao
          tom="destaque"
          titulo="PIX, cartão ou dinheiro"
          texto="Cada um escolhe como pagar. Dá até para parcelar no cartão, e a comissão confere tudo num lugar só."
        >
          <MaqueteDePagamento />
        </Cartao>
        <Cartao
          texto="Cada formando assina pelo celular, e a comissão vê quem já assinou."
          titulo="Termo assinado pelo celular"
        >
          <MaqueteDoTermo />
        </Cartao>
        <Cartao
          tom="destaque"
          className="max-sm:order-1"
          titulo="Gastos e saldo da turma"
          maqueteClassName="sm:min-h-44"
          texto="Acompanhem os gastos e vejam quanto sobra para a festa."
        >
          <MaqueteDeDespesas />
        </Cartao>
        <Cartao
          titulo="Lembrete de pagamento"
          maqueteClassName="items-end"
          texto="Quem tem uma parcela em aberto recebe um lembrete por e-mail."
        >
          <MaqueteDaRegua />
        </Cartao>
        <Cartao
          largo
          className="max-sm:order-2"
          titulo="Festa e meta"
          maqueteClassName="min-h-56"
          texto="Data, local e quanto ainda falta juntar para a festa."
        >
          <MaqueteDaFesta />
        </Cartao>
      </ul>
    </SecaoDaLanding>
  )
}
