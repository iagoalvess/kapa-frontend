import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  Copy,
  Gift,
  GraduationCap,
  Heart,
  Landmark,
  Link2,
  MoreVertical,
} from 'lucide-react'
import { Link } from 'react-router'
import mascoteCelular from '@/assets/mascote/celular.webp'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import qrcode from '@/assets/outros/qrcode.webp'
import whatsapp from '@/assets/outros/whatsapp.webp'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { cn } from '@/lib/utils'
import { SecaoDaLanding } from './SecaoDaLanding'

function SetaAnotada({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 56" fill="none" className={className} aria-hidden>
      <path
        d="M24 3C38 23 31 35 10 48m2-11-3 12 13-1"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Tracos({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden>
      <path d="m7 22 5-17m5 23 14-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

const DADOS_DA_TURMA = [
  { icone: GraduationCap, rotulo: 'Nome da turma', valor: 'Odontologia 2027' },
  { icone: Landmark, rotulo: 'Instituição', valor: 'UFPR' },
  { icone: BookOpen, rotulo: 'Curso', valor: 'Odontologia' },
  { icone: CalendarDays, rotulo: 'Data da colação', valor: 'Dezembro de 2026' },
]

function MaqueteDaTurma() {
  return (
    <div className="relative h-60" aria-hidden>
      <dl className="bg-card shadow-cartao divide-border/60 relative z-10 grid w-[76%] divide-y rounded-[22px] px-3 py-1.5">
        {DADOS_DA_TURMA.map(({ icone: Icone, rotulo, valor }) => (
          <div key={rotulo} className="flex items-center gap-2.5 py-2">
            <span className="bg-brand-wash text-brand-text grid size-7 shrink-0 place-items-center rounded-lg">
              <Icone className="size-4" />
            </span>
            <div className="grid min-w-0 gap-0.5">
              <dt className="text-muted-foreground text-[9px]">{rotulo}</dt>
              <dd className="text-foreground text-[11px] font-medium">{valor}</dd>
            </div>
          </div>
        ))}
      </dl>
      <div className="font-hand text-brand-text absolute -top-9 right-1 z-20 -rotate-12 text-center text-lg leading-4">
        Começa
        <br />
        aqui!
        <Tracos className="text-brand absolute -top-6 -right-4 size-7" />
        <SetaAnotada className="text-brand ml-8 h-10 w-7 rotate-[-12deg]" />
      </div>
      <img
        src={mascoteChecklist}
        alt=""
        loading="lazy"
        width={400}
        height={400}
        className="pointer-events-none absolute -right-7 bottom-0 z-20 w-[54%] max-w-48 drop-shadow-md"
      />
    </div>
  )
}

function MaqueteDoConvite() {
  return (
    <div className="relative mx-auto h-60 w-[90%]" aria-hidden>
      <div className="font-hand text-brand-text absolute -top-9 right-0 z-20 -rotate-12 text-center text-lg leading-4">
        É só compartilhar!
        <SetaAnotada className="text-brand ml-auto h-9 w-7" />
      </div>
      <div className="bg-card shadow-cartao overflow-hidden rounded-t-[22px] border-4 border-white">
        <div className="flex items-center gap-2 px-1 py-2.5">
          <ChevronLeft className="text-muted-foreground size-3 shrink-0" />
          <img
            src={whatsapp}
            alt=""
            loading="lazy"
            width={28}
            height={28}
            className="size-7 shrink-0 object-contain"
          />
          <div className="grid min-w-0 flex-1 gap-0.5">
            <span className="text-foreground text-[11px] font-semibold">Formandos Odonto 2027</span>
            <span className="text-muted-foreground text-[9px]">24 membros</span>
          </div>
          <MoreVertical className="text-muted-foreground size-4 shrink-0" />
        </div>
        <div className="bg-secondary/70 grid gap-2 px-2.5 pt-2 pb-5">
          <div className="bg-success-bg ml-6 rounded-xl rounded-tr-sm px-2.5 pt-2.5 pb-1.5">
            <p className="text-foreground text-[11px] leading-[1.55]">
              Pessoal! 💙
              <br />
              Segue o link da nossa turma
              <br />
              no Kapa pra todo mundo entrar:
            </p>
            <span className="bg-card text-success-text mt-2 flex items-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-medium">
              <Link2 className="size-3.5 shrink-0" />
              <span className="underline underline-offset-2">kapa.app/t/odonto27</span>
            </span>
            <span className="text-muted-foreground mt-1 flex items-center justify-end gap-1 text-[8px]">
              09:14 <CheckCheck className="text-success size-3" />
            </span>
          </div>
          <div className="bg-card flex w-fit items-end gap-5 rounded-xl rounded-tl-sm px-3 py-2 shadow-sm">
            <span className="text-foreground text-[11px]">Já entrei! 🚀</span>
            <span className="text-muted-foreground text-[8px]">09:16</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MaqueteDaBaixa() {
  return (
    <div className="relative h-60" aria-hidden>
      <div className="bg-card shadow-cartao relative z-10 grid w-[80%] gap-3 rounded-[22px] p-3.5">
        <span className="text-brand-text text-xs font-semibold">PIX da turma</span>
        <div className="flex items-start gap-2.5">
          <img src={qrcode} alt="" loading="lazy" width={68} height={68} className="size-[68px] shrink-0" />
          <div className="grid min-w-0 gap-1">
            <span className="text-foreground text-sm font-semibold whitespace-nowrap tabular-nums">
              R$ 256,23
            </span>
            <span className="text-muted-foreground text-[10px]">parcela 2/12</span>
            <span className="text-success-text mt-1 flex items-center gap-1 text-[8px] font-medium">
              <span className="bg-success grid size-3.5 shrink-0 place-items-center rounded-full text-white">
                <Check className="size-2.5" strokeWidth={3} />
              </span>
              Pagamento conferido
            </span>
          </div>
        </div>
        <span className="bg-brand-wash text-brand-text flex items-center justify-center gap-1.5 rounded-xl py-2 text-[10px] font-medium">
          <Copy className="size-3.5" />
          Copiar QR Code
        </span>
      </div>
      <div className="font-hand text-primary-foreground absolute -top-9 -right-1 z-20 -rotate-12 text-center text-lg leading-4">
        Parcela
        <br />
        recebida!
        <Heart className="mx-auto mt-1 size-4 rotate-12" />
      </div>
      <img
        src={mascoteCelular}
        alt=""
        loading="lazy"
        width={400}
        height={400}
        className="pointer-events-none absolute -right-7 bottom-0 z-20 w-[51%] max-w-44 drop-shadow-md"
      />
      <Tracos className="text-primary-foreground absolute right-0 bottom-16 z-20 size-7 rotate-12" />
    </div>
  )
}

const PASSOS = [
  {
    tom: 'creme',
    titulo: 'Crie a turma',
    texto: 'Informe o nome, a instituição, o curso e a data da colação. A comissão inteira entra junto.',
    maquete: <MaqueteDaTurma />,
  },
  {
    tom: 'creme',
    titulo: 'Convide os formandos',
    texto: 'Compartilhe o link no grupo do WhatsApp. Cada um se cadastra e assina o termo pelo celular.',
    maquete: <MaqueteDoConvite />,
  },
  {
    tom: 'destaque',
    titulo: 'Receba no PIX da turma',
    texto: 'Cada parcela vira um QR da conta da comissão. Você confere o extrato e dá baixa na plataforma.',
    maquete: <MaqueteDaBaixa />,
  },
] as const

/** Cenas ilustrativas em DOM, com os mesmos tokens, fontes e mascotes do mural do Hero. */
export function ComoFunciona() {
  return (
    <SecaoDaLanding
      id="como-funciona"
      compacta
      className="gap-8 [&>header]:max-w-4xl [&>header>p:last-child]:max-w-2xl"
      etiqueta="Como funciona"
      titulo="Três passos, e a turma está rodando"
      descricao="Do zero à primeira parcela cobrada numa tarde. Sem instalar nada e sem abrir conta em banco nenhum."
    >
      <div className="relative">
        <div
          aria-hidden
          className="font-hand text-brand-text pointer-events-none absolute -top-32 right-0 hidden -rotate-12 text-center text-xl leading-5 xl:block"
        >
          Organização
          <br />
          de verdade, sem
          <br />
          complicação.
          <Tracos className="text-brand absolute -top-6 -right-2 size-8" />
          <Heart className="text-brand mt-1 ml-auto size-4 rotate-12" />
        </div>
        <ol className="grid gap-5 lg:grid-cols-3">
          {PASSOS.map((passo, indice) => (
            <li
              key={passo.titulo}
              className={cn(
                'relative mx-auto grid w-full max-w-md min-w-0 content-start gap-10 overflow-hidden rounded-3xl border p-5 pb-0 shadow-[0_3px_10px_-5px_rgba(26,26,24,0.12)] lg:max-w-none',
                passo.tom === 'destaque'
                  ? 'border-primary bg-primary'
                  : 'border-brand-tint/70 from-brand-wash to-brand-tint/35 bg-gradient-to-br',
              )}
            >
              <div>
                <span
                  className={cn(
                    'mb-2.5 grid size-8 place-items-center rounded-full text-lg font-semibold tabular-nums',
                    passo.tom === 'destaque' ? 'bg-card text-brand-text' : 'bg-brand text-on-brand',
                  )}
                  aria-hidden
                >
                  {indice + 1}
                </span>
                <h3
                  className={cn(
                    'text-lg font-semibold tracking-tight',
                    passo.tom === 'destaque' ? 'text-primary-foreground' : 'text-foreground',
                  )}
                >
                  {passo.titulo}
                </h3>
                <p
                  className={cn(
                    'mt-1.5 max-w-[30ch] text-[13px] leading-relaxed text-pretty lg:min-h-[4.125rem]',
                    passo.tom === 'destaque' ? 'text-primary-foreground/90' : 'text-muted-foreground',
                  )}
                >
                  {passo.texto}
                </p>
              </div>
              {passo.maquete}
            </li>
          ))}
        </ol>
      </div>
      <div className="grid justify-items-center gap-3">
        <Button asChild size="lg" className="h-11 rounded-xl text-sm shadow-lg">
          <Link to={ROTAS.criarConta}>
            <GraduationCap className="size-4" aria-hidden />
            Criar minha turma
          </Link>
        </Button>
        <p className="text-texto-muted flex items-center justify-center gap-2 text-center text-xs leading-[18px]">
          <span className="bg-brand-tint text-brand-text grid size-5 shrink-0 place-items-center rounded-full">
            <Gift className="size-3" aria-hidden />
          </span>
          Grátis até a turma começar a pagar as parcelas.
        </p>
      </div>
    </SecaoDaLanding>
  )
}
