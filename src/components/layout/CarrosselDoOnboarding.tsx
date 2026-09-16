import { Check, Crown, Link2, Users } from 'lucide-react'
import { type CSSProperties, useState } from 'react'
import mascoteCelular from '@/assets/mascote/celular.webp'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import imagemDaMoeda from '@/assets/outros/moeda.webp'
import { Avatar } from '@/components/Avatar'
import { formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { Carrossel, Mensagem, type Slide } from './CarrosselDaMarca'

/*
  ponytail: conteúdo ilustrativo, como o do carrossel das telas de conta. Aqui a história é o que
  vem depois de entrar: o link no grupo, a comissão montada e o caixa andando. Mesma mecânica —
  HTML + CSS, animação só sob `motion-safe:`, keyframes em `styles/index.css`.
*/

const atraso = (segundos: number): CSSProperties => ({ animationDelay: `${segundos}s` })

const ENTRADAS = [
  { nome: 'Ana', semente: 'Ana', atraso: 2.1 },
  { nome: 'Bruno', semente: 'Bruno-6', atraso: 2.6 },
  { nome: 'Carla', semente: 'Carla', atraso: 3.1 },
]

/** O link cai no grupo da turma, e os formandos vão entrando sozinhos. */
function CenaLinkNoGrupo() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 p-6">
      <div className="text-on-brand mb-1 flex items-center gap-2.5">
        <span className="bg-card text-brand grid size-9 place-items-center rounded-full">
          <Users className="size-5" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold">Grupo · Medicina 2027</span>
          <span className="text-on-brand/75 text-xs">86 participantes</span>
        </span>
      </div>

      <Mensagem lado="esquerda" atraso={0.3}>
        <strong>Comissão:</strong> pessoal, entrem na turma por aqui 👇
      </Mensagem>

      <div
        style={atraso(1.1)}
        className="motion-safe:animate-surgir bg-card flex max-w-[85%] items-center gap-3 rounded-2xl rounded-bl-md p-2.5 shadow-sm"
      >
        <span className="bg-brand-wash text-brand grid size-10 shrink-0 place-items-center rounded-xl">
          <Link2 className="size-6" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="text-foreground block text-[13px] font-semibold">Entrar na turma</span>
          <span className="text-brand-text flex items-center gap-1 truncate text-xs">
            <Link2 className="size-3 shrink-0" />
            kapa.app/convite/med27
          </span>
        </span>
      </div>

      {/* Até 75%: a quina de baixo, à direita, é do mascote. */}
      <div className="mt-1 flex max-w-[75%] flex-wrap gap-1.5">
        {ENTRADAS.map(({ nome, semente, atraso: segundos }) => (
          <span
            key={nome}
            style={atraso(segundos)}
            className="motion-safe:animate-surgir bg-card text-foreground flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-0.5 text-[11px] font-semibold shadow-sm"
          >
            <Avatar nome={nome} semente={semente} className="text-[11px] font-bold" />
            {nome} entrou
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Cada um chega numa pílula solta; o recuo em zigue-zague tira a cara de tabela. A semente do
 * avatar é escolhida para três cores diferentes — e nenhuma laranja, que some no fundo.
 */
const COMISSAO = [
  { nome: 'Helena', semente: 'Helena', papel: 'Presidente', recuo: 'ml-0', atraso: 0.3 },
  { nome: 'Carlos', semente: 'Carlos', papel: 'Tesoureiro', recuo: 'ml-8', atraso: 1.1 },
  { nome: 'Juliana', semente: 'Juliana-6', papel: 'Comissão', recuo: 'ml-4', atraso: 1.9 },
]

/** O aceite chega meio segundo depois da pessoa — e é ele que enche o trecho dela na barra. */
const ACEITE = 0.5

/** "Comissão pronta" entra logo depois do último aceite. */
const PRONTA = (COMISSAO.at(-1)?.atraso ?? 0) + ACEITE + 0.4

/**
 * A comissão se montando sobre o laranja, como as outras cenas: cada pessoa numa pílula, o
 * aceite em seguida, e a barra de três trechos se completando no mesmo compasso.
 */
function CenaComissao() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 p-6">
      <div className="text-on-brand mb-1 flex items-center gap-2.5">
        <span className="bg-card text-brand grid size-9 place-items-center rounded-full">
          <Crown className="size-5" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold">Comissão da turma</span>
          <span className="text-on-brand/75 text-xs">montada antes de contratar</span>
        </span>
      </div>

      {COMISSAO.map(({ nome, semente, papel, recuo, atraso: segundos }) => (
        <div key={nome} className={cn('flex items-center gap-2', recuo)}>
          <span
            style={atraso(segundos)}
            className="motion-safe:animate-surgir bg-card text-foreground flex items-center gap-2 rounded-full py-1 pr-3.5 pl-1 text-[13px] shadow-sm"
          >
            <Avatar nome={nome} semente={semente} className="size-7 text-xs font-bold" />
            <span className="font-semibold">{nome}</span>
            <span className="text-muted-foreground">{papel}</span>
          </span>
          <span
            style={atraso(segundos + ACEITE)}
            className="motion-safe:animate-surgir bg-success text-primary-foreground grid size-6 place-items-center rounded-full shadow-sm"
          >
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        </div>
      ))}

      {/* Até 70%: a quina de baixo, à direita, é do mascote. */}
      <div className="mt-2 grid max-w-[70%] gap-1.5">
        <div className="flex gap-1.5">
          {COMISSAO.map(({ nome, atraso: segundos }) => (
            <span key={nome} className="bg-on-brand/25 h-2 flex-1 overflow-hidden rounded-full">
              <span
                style={atraso(segundos + ACEITE)}
                className="motion-safe:animate-crescer bg-card block h-full origin-left rounded-full"
              />
            </span>
          ))}
        </div>
        <span
          style={atraso(PRONTA)}
          className="motion-safe:animate-surgir text-on-brand text-xs font-semibold"
        >
          Comissão pronta · 3 de 3
        </span>
      </div>
    </div>
  )
}

/**
 * Todas miram a fenda da caixa: a caixa tem 224px a partir de 24px, então a fenda fica em 136px, e
 * a moeda tem 36px. A variação é só para não parecer carimbo.
 */
const MOEDAS = [
  { esquerda: '112px', atraso: 0 },
  { esquerda: '122px', atraso: 0.8 },
  { esquerda: '117px', atraso: 1.6 },
]

const CAIXA_INICIAL = 12_450
const PARCELA = 150
const META_DA_FESTA = 17_300
const QUEM_PAGA = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabi']

/**
 * Moedas caindo na caixa da turma: cada uma que entra soma uma parcela ao valor, à meta e aos
 * lançamentos — e a caixa dá uma sacudida. A caixa é HTML puro: tampa laranja-clara com a fenda,
 * frente branca com o valor.
 *
 * A soma vem do fim de cada volta da moeda (`animationiteration`), que a keyframe `cair` faz
 * coincidir com a entrada na fenda — o número sobe junto com a moeda, sem relógio paralelo para
 * sair de compasso. Sem movimento, a moeda não anda e o caixa fica parado.
 */
function CenaCaixa() {
  const [entradas, definirEntradas] = useState(0)
  const valor = CAIXA_INICIAL + entradas * PARCELA
  const meta = Math.min(100, Math.round((valor / META_DA_FESTA) * 100))
  // As duas últimas, a mais nova primeiro. O número da entrada é a chave: a nova surge, a velha fica.
  const recentes = [entradas, entradas - 1].filter((n) => n > 0)

  return (
    <div className="relative h-full p-6">
      <span
        style={atraso(0.2)}
        className="motion-safe:animate-surgir bg-card text-foreground absolute top-5 left-6 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm"
      >
        <span className="bg-success text-primary-foreground grid size-4 place-items-center rounded-full">
          <Check className="size-3" strokeWidth={3} />
        </span>
        Plano Completo ativo
      </span>

      {/* Os dois últimos pagamentos, no alto à direita — a quina de baixo é do mascote. */}
      <div className="absolute top-5 right-6 flex flex-col items-end gap-1.5">
        {recentes.map((n) => (
          <span
            key={n}
            className="motion-safe:animate-surgir bg-card text-success-text rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm"
          >
            + R$ {formatarNumero(PARCELA)} · {QUEM_PAGA[(n - 1) % QUEM_PAGA.length]}
          </span>
        ))}
      </div>

      {/*
        Em loop: cada moeda cai girando, entra na fenda e some. Sem movimento, ficam paradas no
        alto. A sombra separa o dourado do fundo laranja.
      */}
      {MOEDAS.map(({ esquerda, atraso: segundos }) => (
        <img
          key={esquerda}
          src={imagemDaMoeda}
          alt=""
          style={{ ...atraso(segundos), left: esquerda, '--queda': '84px' } as CSSProperties}
          onAnimationIteration={() => definirEntradas((n) => n + 1)}
          className="motion-safe:animate-cair absolute top-[52px] z-10 size-9 drop-shadow-md"
        />
      ))}

      {/* `key` pelas entradas: cada moeda que cai remonta a caixa, e ela sacode. */}
      <div
        key={entradas}
        className={cn(
          'bg-card absolute top-[140px] left-6 w-56 origin-bottom overflow-hidden rounded-2xl shadow-lg',
          entradas > 0 && 'motion-safe:animate-sacudir',
        )}
      >
        {/* A tampa, com a fenda no meio: é ali que as moedas somem. */}
        <div className="bg-brand-wash border-brand-tint relative h-7 border-b">
          <span className="bg-foreground/25 absolute top-1/2 left-1/2 h-1.5 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full" />
        </div>
        <div className="grid gap-1 px-4 py-4 leading-tight">
          <span className="text-muted-foreground text-[11px] font-medium">Caixa da turma</span>
          <span className="motion-safe:animate-surgir text-foreground text-2xl font-extrabold">
            R$ {formatarNumero(valor)}
          </span>
        </div>
      </div>

      {/* Logo abaixo da caixa, e até 55% da largura: a quina de baixo, à direita, é do mascote. */}
      <div className="absolute top-[268px] left-6 grid w-[55%] gap-1.5">
        <div className="bg-on-brand/25 h-2 overflow-hidden rounded-full">
          <div
            style={{ ...atraso(0.5), width: `${meta}%` }}
            className="motion-safe:animate-crescer bg-card h-full origin-left rounded-full transition-[width]"
          />
        </div>
        <span className="text-on-brand text-xs font-semibold">{meta}% da meta da festa</span>
      </div>
    </div>
  )
}

const SLIDES: readonly Slide[] = [
  {
    Cena: CenaLinkNoGrupo,
    mascote: mascoteCelular,
    frase: 'Um link no grupo, e cada formando entra sozinho na turma.',
  },
  {
    Cena: CenaComissao,
    mascote: mascoteChecklist,
    frase: 'Monte a comissão antes mesmo de contratar o plano.',
  },
  {
    Cena: CenaCaixa,
    mascote: mascoteCofrinho,
    frase: 'Com o plano ativo, cada contribuição cai direto no caixa da turma.',
  },
]

/**
 * Painel da marca no onboarding (escolher, criar ou entrar numa formatura). Quem chega aqui já
 * tem conta: em vez de vender o produto, mostra o caminho da turma a partir dali.
 */
export function CarrosselDoOnboarding() {
  return <Carrossel slides={SLIDES} />
}
