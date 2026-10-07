import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  GraduationCap,
  Heart,
  Landmark,
  Link2,
  MoreVertical,
} from 'lucide-react'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import qrcode from '@/assets/outros/qrcode.webp'
import whatsapp from '@/assets/outros/whatsapp.webp'
import { Folha } from '@/components/Folha'
import { cn } from '@/lib/utils'
import { ChamadaPrincipal } from './ChamadaPrincipal'
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
      <div className="bg-card shadow-cartao border-card overflow-hidden rounded-t-[22px] border-4">
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

function MaqueteDaCobranca() {
  return (
    <div className="relative -mt-4 flex h-60 items-start pt-3" aria-hidden>
      {/* O plano anotado numa folha presa por clipe, com o termo carimbado: a papelaria do Hero. */}
      <Folha prende="grampo" dobra compacto className="z-10 grid w-[82%] -rotate-2 gap-2.5 p-3.5 pt-6">
        <span className="font-hand text-brand-text text-xl leading-none">Plano da turma</span>
        <span className="border-success/60 text-success-text absolute top-4 right-3 flex rotate-6 items-center gap-1 rounded-md border-2 px-1.5 py-0.5 text-[9px] font-semibold">
          <Check className="size-3" strokeWidth={3} />
          Termo publicado
        </span>
        <div className="flex items-center gap-3">
          <span className="bg-card shadow-foto shrink-0 -rotate-3 p-1">
            <img src={qrcode} alt="" loading="lazy" width={60} height={60} className="size-[60px]" />
          </span>
          <div className="grid min-w-0">
            <span className="text-foreground text-base font-extrabold tracking-tight whitespace-nowrap tabular-nums">
              12 × R$ 256,23
            </span>
            <span className="text-muted-foreground text-[10px]">vence todo dia 10</span>
          </div>
        </div>
        <ul className="border-border text-foreground flex gap-3 border-t border-dashed pt-2 pr-6 text-[10px] font-medium">
          {['PIX', 'Cartão', 'Dinheiro'].map((meio) => (
            <li key={meio} className="flex items-center gap-1">
              <Check className="text-brand-text size-3" strokeWidth={3} />
              {meio}
            </li>
          ))}
        </ul>
      </Folha>
      <div className="font-hand text-primary-foreground absolute -top-6 -right-1 z-20 -rotate-12 text-center text-lg leading-4">
        Tudo
        <br />
        pronto!
        <Heart className="mx-auto mt-1 size-4 rotate-12" />
      </div>
    </div>
  )
}

const PASSOS = [
  {
    tom: 'creme',
    titulo: 'Crie a turma',
    texto:
      'Conte o nome da turma, a instituição, o curso e a data da formatura. Depois, chame a comissão para dividir as tarefas.',
    maquete: <MaqueteDaTurma />,
  },
  {
    tom: 'destaque',
    titulo: 'Organize as parcelas',
    texto:
      'Escolha o valor, as datas de pagamento e como a turma vai receber: PIX, cartão ou dinheiro. Deixe o combinado no termo de adesão.',
    maquete: <MaqueteDaCobranca />,
  },
  {
    tom: 'creme',
    titulo: 'Convide os formandos',
    texto:
      'Escolha o plano e mande o link no grupo. Cada formando entra, assina o termo pelo celular e vê suas parcelas.',
    maquete: <MaqueteDoConvite />,
  },
] as const

/** Cenas ilustrativas em DOM, com os mesmos tokens, fontes e mascotes do mural do Hero. */
export function ComoFunciona() {
  return (
    <SecaoDaLanding
      id="como-funciona"
      className="gap-10"
      titulo="Três passos para organizar"
      destaque="sua turma."
      nota="crie a turma, organize as parcelas e chame o pessoal"
      descricao="Tudo pelo navegador. A comissão prepara a turma, e os formandos entram pelo link enviado no grupo."
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
                'shadow-vitrine relative mx-auto grid w-full max-w-md min-w-0 content-start gap-10 overflow-hidden rounded-3xl border p-5 pb-0 lg:max-w-none',
                passo.tom === 'destaque' ? 'border-primary bg-primary' : 'border-brand-tint/70 bg-brand-wash',
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
        <ChamadaPrincipal size="lg" className="h-11 rounded-xl text-sm shadow-lg" />
        <p className="text-texto-muted flex items-center justify-center gap-2 text-center text-xs leading-[18px]">
          Comece de graça com a sua comissão.
        </p>
      </div>
    </SecaoDaLanding>
  )
}
