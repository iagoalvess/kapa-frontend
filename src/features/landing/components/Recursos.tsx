import { Camera, Check, Copy, Flower2, Heart, MapPin, ShieldCheck, Utensils } from 'lucide-react'
import type { ReactNode } from 'react'
import avatarAna from '@/assets/avatares/ana-clara.webp'
import avatarBruno from '@/assets/avatares/bruno-lima.webp'
import avatarCarla from '@/assets/avatares/carla-souza.webp'
import fotoDoBaile from '@/assets/fotos/baile.webp'
import qrcode from '@/assets/outros/qrcode.webp'
import carteira from '@/assets/outros/carteira.webp'
import { cn } from '@/lib/utils'
import { SecaoDaLanding } from './SecaoDaLanding'
import { MetaDaTurmaAnimada } from './MetaDaTurmaAnimada'

/** Mantém a grade 2–1–1 / 1–1–2 e reserva o mesmo espaço para cada maquete. */
function Cartao({
  titulo,
  texto,
  largo = false,
  tom = 'creme',
  tituloPrimeiro = false,
  children,
}: {
  titulo: string
  texto: string
  largo?: boolean
  tom?: 'creme' | 'destaque'
  tituloPrimeiro?: boolean
  children: ReactNode
}) {
  return (
    <li
      className={cn(
        'cartao-ao-rolar group relative grid min-h-52 min-w-0 content-between gap-3 overflow-hidden rounded-3xl border p-4 shadow-[0_3px_10px_-5px_rgba(26,26,24,0.12)] transition-shadow duration-300 hover:shadow-[0_14px_30px_-18px_rgba(26,26,24,0.3)]',
        // A seção é o creme; o cartão é o claro do hero. Chapado, porque um degradê que terminasse
        // no creme faria o canto do cartão sumir no fundo.
        tom === 'creme' && 'border-brand-tint/70 bg-background',
        tom === 'destaque' && 'border-primary bg-primary',
        largo && 'lg:col-span-2',
      )}
    >
      <div className="relative flex h-36 min-w-0 items-center">{children}</div>
      <div className={cn('relative grid gap-1', tituloPrimeiro && 'order-first')}>
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

function MaquetePix() {
  return (
    <div className="w-full space-y-2">
      <div className="bg-card border-border/60 flex items-center gap-3 rounded-2xl border p-3 shadow-sm">
        <img src={qrcode} alt="" loading="lazy" className="size-16 shrink-0 rounded-md" />
        <div className="grid min-w-0 gap-1">
          <span className="text-brand-text text-[10px] font-semibold">PIX da turma</span>
          <span className="text-foreground text-xs font-bold">
            Direto na conta
            <br />
            da comissão
          </span>
          <span className="text-muted-foreground flex items-center gap-1 text-[9px]">
            Copiar chave <Copy className="size-3" aria-hidden />
          </span>
        </div>
      </div>
      <div className="bg-success-bg text-success-text flex items-center gap-2 rounded-xl px-3 py-2">
        <span className="bg-success grid size-5 shrink-0 place-items-center rounded-full text-white">
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

function MaqueteDeDespesas() {
  return (
    <div className="grid w-full gap-2">
      <div className="grid grid-cols-[minmax(0,1fr)_56px] items-center gap-1.5">
        <dl className="bg-card divide-border/60 grid divide-y rounded-xl px-2 py-1 shadow-sm">
          {DESPESAS.map((despesa) => (
            <div key={despesa.rotulo} className="flex items-center gap-1 py-0.5">
              <span
                className="bg-brand-wash text-brand-text grid size-5 shrink-0 place-items-center rounded-md"
                aria-hidden
              >
                <despesa.icone className="size-3" />
              </span>
              <dt className="text-foreground flex-1 text-[9px]">{despesa.rotulo}</dt>
              <dd className="text-foreground text-[9px] font-medium whitespace-nowrap tabular-nums">
                {despesa.valor}
              </dd>
            </div>
          ))}
        </dl>
        <img
          src={carteira}
          alt=""
          loading="lazy"
          className="motion-safe:animate-flutuar-devagar w-14 drop-shadow-sm"
        />
      </div>
      <div className="bg-card flex items-center gap-3 rounded-xl px-3 py-2 shadow-sm">
        <div className="grid shrink-0 gap-0.5">
          <span className="text-muted-foreground text-[10px]">Saldo projetado</span>
          <strong className="text-success-text text-base leading-tight font-bold tabular-nums">
            R$ 18.360
          </strong>
        </div>
        <span
          className="bg-success-bg mt-3 block h-2 min-w-0 flex-1 overflow-hidden rounded-full"
          aria-hidden
        >
          <span className="bg-success/35 crescer-ao-rolar block h-full w-[64%] origin-left rounded-full" />
        </span>
      </div>
    </div>
  )
}

function MaqueteDaRegua() {
  return (
    <div className="relative mx-auto flex h-full w-full max-w-64 items-center justify-center pr-7">
      <div className="relative w-[164px] -rotate-6 rounded-[20px] bg-white px-3.5 py-2.5 shadow-[0_10px_25px_-15px_rgba(166,73,100,0.3)]">
        <div className="motion-safe:animate-flutuar-devagar relative mx-auto mb-1.5 h-8 w-10" aria-hidden>
          <svg viewBox="0 0 48 36" className="size-full overflow-visible drop-shadow-sm">
            <rect x="3" y="5" width="40" height="27" rx="3" fill="#ffd5d8" />
            <path d="M4 7 23 23 42 7" fill="#ff807e" />
            <path d="m4 31 14-13m24 13L28 18" fill="none" stroke="#fff0f0" strokeWidth="2" />
            <path d="M4 6 23 18 42 6" fill="#ffb0b1" />
          </svg>
          <span className="absolute -top-0.5 -right-1 grid size-4 place-items-center rounded-full bg-[#ff6856] text-[9px] text-white ring-2 ring-white">
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
        className="motion-safe:animate-flutuar absolute top-0 right-0 h-16 w-10 text-[#ff735f]"
        aria-hidden
      >
        <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="m9 18-1-10M22 12l4-9M33 21l10-8" />
        </g>
        <path
          d="m4 43 39-12-12 37-10-12-10 6 3-15Z"
          fill="currentColor"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="m15 47 18-9-12 18" fill="#ffad9e" />
      </svg>
    </div>
  )
}

function MaqueteDaFesta() {
  return (
    <div className="grid h-full w-full grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-center gap-3">
      <div className="relative mx-1">
        <figure className="bg-card -rotate-3 rounded-lg p-1.5 pb-1 shadow-md motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:rotate-0">
          <img src={fotoDoBaile} alt="" loading="lazy" className="h-24 w-full rounded object-cover" />
          <figcaption className="font-hand text-brand-text flex items-center justify-center gap-1 py-1 text-xs leading-none lg:text-sm">
            O grande dia <Heart className="size-3" aria-hidden />
          </figcaption>
        </figure>
      </div>
      <div className="grid min-w-0 gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-card text-brand-text grid size-8 shrink-0 content-center justify-items-center rounded-lg shadow-sm">
            <span className="text-[8px] leading-none font-semibold">DEZ</span>
            <strong className="text-sm leading-tight">12</strong>
          </span>
          <div className="grid min-w-0 gap-1">
            <span className="text-foreground text-[10px] leading-tight font-semibold sm:text-xs">
              12 de dezembro de 2026
            </span>
            <span className="text-muted-foreground flex items-start gap-1 text-[9px] leading-tight sm:text-[10px]">
              <MapPin className="text-brand-text size-3 shrink-0" aria-hidden />
              Espaço Vista Verde
            </span>
          </div>
        </div>
        <MetaDaTurmaAnimada />
      </div>
    </div>
  )
}

/** Maquetes em DOM, com a paleta, as cartas e a fotografia do mural do Hero. */
export function Recursos() {
  return (
    <SecaoDaLanding
      id="recursos"
      creme
      compacta
      className="gap-6"
      etiqueta="Recursos"
      // Frase em uma linha só: o corpo encolhe com a viewport para não quebrar no celular.
      titulo={
        <span className="block text-[clamp(0.95rem,4.3vw,2.25rem)] whitespace-nowrap">
          Tudo o que a planilha nunca fez pela turma
        </span>
      }
      descricao="Quem já pagou, quem esqueceu e quanto ainda falta para a festa acontecer."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao
          largo
          tituloPrimeiro
          titulo="Cobranças e parcelas"
          texto="Plano da turma, parcela por formando e pagamento de várias de uma vez."
        >
          <MaqueteDeParcelas />
        </Cartao>
        <Cartao
          tom="destaque"
          titulo="PIX + conferência"
          texto="QR da chave da comissão e baixa em lote pela tesouraria."
        >
          <MaquetePix />
        </Cartao>
        <Cartao titulo="Termo de adesão digital" texto="Aceite versionado e o controle de quem aderiu.">
          <MaqueteDoTermo />
        </Cartao>
        <Cartao
          tom="destaque"
          titulo="Despesas, fornecedores e caixa"
          texto="Saídas da turma e projeção de saldo."
        >
          <MaqueteDeDespesas />
        </Cartao>
        <Cartao titulo="Régua de cobrança" texto="Lembretes e notificações automáticas por e-mail.">
          <MaqueteDaRegua />
        </Cartao>
        <Cartao
          largo
          titulo="A festa e a meta"
          texto="Data, local, orçamento-alvo e o progresso da arrecadação."
        >
          <MaqueteDaFesta />
        </Cartao>
      </ul>
    </SecaoDaLanding>
  )
}
