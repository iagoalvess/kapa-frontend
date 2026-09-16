import { Camera, Check, GraduationCap, IdCard, Mail, MapPin, PartyPopper, ReceiptText } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react'
import mascoteAcenando from '@/assets/mascote/acenando.webp'
import mascoteFeliz from '@/assets/mascote/feliz.webp'
import mascoteLendo from '@/assets/mascote/lendo.webp'
import { Avatar } from '@/components/Avatar'
import { Selo } from '@/components/Selo'

/*
  ponytail: conteúdo ilustrativo, com nomes e valores de exemplo. Quando o produto fechar as
  mensagens de cada slide, só os textos desta tela mudam — a mecânica fica.

  Cada cena é HTML + CSS, sem imagem nem biblioteca de animação. As keyframes vivem em
  `styles/index.css` e só rodam sob `motion-safe:`: sem movimento, cada elemento fica na posição
  de repouso e a cena vira uma composição estática que ainda conta a mesma história.
*/

/** Balão de conversa que surge depois de `atraso` segundos. */
export function Mensagem({
  lado,
  atraso,
  children,
}: {
  lado: 'esquerda' | 'direita'
  atraso: number
  children: ReactNode
}) {
  return (
    <p
      style={{ animationDelay: `${atraso}s` }}
      className={`motion-safe:animate-surgir max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug shadow-sm ${
        lado === 'direita'
          ? 'bg-brand-tint text-foreground self-end rounded-br-md'
          : 'bg-card text-foreground rounded-bl-md'
      }`}
    >
      {children}
    </p>
  )
}

/**
 * Três formandos e o cadastro de cada um enchendo. O primeiro chega a 100% e o selo vira de "Falta
 * o essencial" para "Completo" no instante em que a barra fecha — é a lista de Membros do app.
 */
const CADASTROS = [
  { nome: 'Ana Souza', semente: 'Ana', completude: 100, atraso: 0.3, vira: true },
  { nome: 'Bruno Lima', semente: 'Bruno-6', completude: 60, atraso: 0.9, vira: false },
  { nome: 'Carla Dias', semente: 'Carla', completude: 20, atraso: 1.5, vira: false },
] as const

/** A barra começa 0,2 s depois da linha e leva 1,8 s (`--animate-crescer`): é quando ela fecha. */
const BARRA_FECHA = 0.2 + 1.8

function CenaCadastro() {
  return (
    <div className="flex h-full flex-col justify-center gap-2 p-6">
      <div className="text-on-brand mb-1 flex items-center gap-2.5">
        <span className="bg-card text-brand grid size-9 place-items-center rounded-full">
          <IdCard className="size-5" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold">Cadastro da turma</span>
          <span className="text-on-brand/75 text-xs">Medicina 2027 · 42 formandos</span>
        </span>
      </div>

      {/* Até 80%: a quina de baixo, à direita, é do mascote. */}
      {CADASTROS.map(({ nome, semente, completude, atraso, vira }) => (
        <div
          key={nome}
          style={{ animationDelay: `${atraso}s` }}
          className="motion-safe:animate-surgir bg-card grid max-w-[80%] gap-1.5 rounded-2xl px-3 py-2 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Avatar nome={nome} semente={semente} className="text-[11px] font-bold" />
            <span className="text-foreground text-[13px] font-semibold">{nome}</span>
            <span className="ml-auto grid">
              {vira ? (
                <>
                  {/* Sem movimento, fica só o estado final: o "Falta o essencial" nem aparece. */}
                  <span
                    style={{ animationDelay: `${atraso + BARRA_FECHA}s` }}
                    className="motion-safe:animate-sumir hidden [grid-area:1/1] motion-safe:block"
                  >
                    <Selo tom="alerta">Falta o essencial</Selo>
                  </span>
                  <span
                    style={{ animationDelay: `${atraso + BARRA_FECHA}s` }}
                    className="motion-safe:animate-surgir justify-self-end [grid-area:1/1]"
                  >
                    <Selo tom="sucesso">Completo</Selo>
                  </span>
                </>
              ) : completude < 30 ? (
                <Selo tom="alerta">Falta o essencial</Selo>
              ) : null}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
              <span
                style={{ animationDelay: `${atraso + 0.2}s`, width: `${completude}%` }}
                className="motion-safe:animate-crescer bg-brand block h-full origin-left rounded-full"
              />
            </span>
            <span className="text-muted-foreground w-8 text-right text-[11px] tabular-nums">
              {completude}%
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Um pagamento entrando na máquina, e o lançamento que sai dela. */
function Passagem({ entrada, saida, atraso }: { entrada: string; saida: string; atraso: number }) {
  const tempo: CSSProperties = { animationDelay: `${atraso}s` }

  return (
    <>
      <span
        style={{ ...tempo, '--percurso': '118px' } as CSSProperties}
        className="motion-safe:animate-entrar-na-maquina bg-card text-foreground absolute top-1/2 left-4 -mt-4 flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold shadow-sm"
      >
        <ReceiptText className="text-muted-foreground size-3.5" />
        {entrada}
      </span>
      <span
        style={{ ...tempo, '--percurso': '118px' } as CSSProperties}
        className="motion-safe:animate-sair-da-maquina bg-card text-foreground absolute top-1/2 right-4 -mt-4 flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold shadow-sm"
      >
        <span className="bg-success text-primary-foreground grid size-4 place-items-center rounded-full">
          <Check className="size-3" strokeWidth={3} />
        </span>
        {saida}
      </span>
    </>
  )
}

function CenaMaquina() {
  return (
    <div className="relative h-full">
      <div className="border-on-brand/40 absolute inset-x-6 top-1/2 border-t-2 border-dashed" />

      {/* Uma de cada vez: a segunda só entra quando a primeira já saiu (ver `styles/index.css`). */}
      <Passagem entrada="Pix R$ 150" saida="Ana · parcela 3/10" atraso={0} />
      <Passagem entrada="Pix R$ 150" saida="Bruno · parcela 3/10" atraso={3} />

      <div className="motion-safe:animate-processar bg-card text-brand absolute top-1/2 left-1/2 z-10 -mt-12 -ml-12 grid size-24 place-items-center rounded-3xl shadow-lg">
        <GraduationCap className="size-11" />
      </div>
    </div>
  )
}

const CIRCUNFERENCIA = 2 * Math.PI * 52

const PILULAS = [
  { icone: Check, texto: 'Buffet pago', atraso: 1.4 },
  { icone: Camera, texto: 'Fotos em dia', atraso: 1.8 },
  { icone: Mail, texto: 'Convites prontos', atraso: 2.2 },
  { icone: MapPin, texto: 'Local reservado', atraso: 2.6 },
  { icone: PartyPopper, texto: 'Festa em 94 dias', atraso: 3 },
]

function CenaMeta() {
  const progresso = 0.72

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-5">
      <div className="relative grid size-36 place-items-center">
        <span className="motion-safe:animate-halo border-on-brand/60 absolute inset-0 rounded-full border-2 border-dashed" />

        <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-on-brand/25" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={CIRCUNFERENCIA * (1 - progresso)}
            style={{ '--circunferencia': CIRCUNFERENCIA, animationDelay: '0.3s' } as CSSProperties}
            className="motion-safe:animate-encher stroke-card"
          />
        </svg>

        <span className="text-on-brand relative text-center leading-tight">
          <span className="block text-3xl font-extrabold">72%</span>
          <span className="text-xs">da meta</span>
        </span>
      </div>

      {/* Linhas explícitas, e não `flex-wrap`: a quebra automática depende da largura do texto e não garante 3 + 2. */}
      <div className="flex flex-col items-start gap-1.5">
        {[PILULAS.slice(0, 3), PILULAS.slice(3)].map((linha) => (
          <div key={linha[0]?.texto} className="flex gap-1.5">
            {linha.map(({ icone: Icone, texto, atraso }) => (
              <span
                key={texto}
                style={{ animationDelay: `${atraso}s` }}
                className="motion-safe:animate-surgir bg-card text-foreground flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap shadow-sm"
              >
                <Icone className="text-brand size-3" />
                {texto}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const SLIDES: readonly Slide[] = [
  {
    Cena: CenaCadastro,
    mascote: mascoteAcenando,
    frase: 'Cada formando preenche o próprio cadastro — e a comissão vê quem falta.',
  },
  { Cena: CenaMaquina, mascote: mascoteLendo, frase: 'Cada contribuição entra no lugar certo, sozinha.' },
  {
    Cena: CenaMeta,
    mascote: mascoteFeliz,
    frase: 'A meta da formatura subindo — e todo mundo vê quanto falta.',
  },
]

/**
 * Troca de slide 6s depois da última troca; para se o usuário pediu menos animação.
 *
 * Um timer por slide, e não um `setInterval` fixo: com o intervalo, clicar num indicador perto
 * do fim do ciclo trocava o slide escolhido logo em seguida.
 */
function useCarrossel(total: number) {
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const id = setTimeout(() => setIndice((indice + 1) % total), 6000)
    return () => clearTimeout(id)
  }, [indice, total])

  return [indice, setIndice] as const
}

/** Um slide: a cena animada, o mascote que sai pela quina e a frase embaixo. */
export interface Slide {
  Cena: () => ReactNode
  mascote: string
  frase: string
}

/** Painel da marca nas telas de conta: login, cadastro e senha. */
export function CarrosselDaMarca() {
  return <Carrossel slides={SLIDES} />
}

/**
 * A moldura de todo carrossel da marca: o cartão translúcido com a cena, o mascote, os
 * indicadores e a frase. Cada carrossel só escolhe os slides.
 */
export function Carrossel({ slides }: { slides: readonly Slide[] }) {
  const [slide, setSlide] = useCarrossel(slides.length)
  const atual = slides[slide]
  if (!atual) return null
  const { Cena, mascote, frase } = atual

  return (
    <>
      {/* `key` remonta a cena na troca, e as animações recomeçam do zero em vez de pegar no meio. */}
      <div key={slide} className="relative w-full max-w-100">
        <div className="border-on-brand/20 bg-on-brand/10 aspect-[56/45] overflow-hidden rounded-3xl border backdrop-blur-sm">
          <Cena />
        </div>

        {/* Fora do cartão (que corta o que vaza), para o mascote poder sair pela quina direita. */}
        <img
          src={mascote}
          alt=""
          className="motion-safe:animate-surgir pointer-events-none absolute -right-12 -bottom-10 w-40 drop-shadow-xl"
        />
      </div>

      <div className="mt-8 flex gap-2" role="tablist" aria-label="Destaques">
        {slides.map((item, i) => (
          <button
            key={item.frase}
            type="button"
            role="tab"
            aria-selected={i === slide}
            aria-label={`Destaque ${i + 1}`}
            onClick={() => setSlide(i)}
            className={`h-2 rounded-full transition-all ${i === slide ? 'bg-on-brand w-6' : 'bg-on-brand/40 w-2'}`}
          />
        ))}
      </div>

      <p className="mt-8 min-h-[4rem] max-w-lg text-center text-2xl leading-snug font-semibold">{frase}</p>
    </>
  )
}
