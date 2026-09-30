import { type KeyboardEvent, type PointerEvent, useId, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
  CADEIRA,
  cadeirasDaMesa,
  GRADE,
  METRO,
  type MesaDesenhavel,
  type Ponto,
  type Tamanho,
  tampoDaMesa,
} from '../lib/salao'
import type { ElementoDoSalao, PlantaDoSalao } from '../types/mesas.types'
import { CORES_DA_AREA, ELEMENTOS_DO_SALAO } from '../lib/catalogoDoSalao'

/** O que está escolhido no mapa: uma mesa, pelo id, ou um elemento, pela posição na lista. */
export type Selecao = { tipo: 'mesa'; id: string } | { tipo: 'elemento'; indice: number }

/**
 * Como a mesa aparece: com dono (laranja), reservada (lilás), livre, e — no mapa do formando — a dele
 * (laranja) e as dos outros (neutras).
 */
type TomDaMesa = 'dono' | 'reservada' | 'livre'

export interface MesaNoMapa extends MesaDesenhavel {
  id: string
  identificacao: string
  x: number
  y: number
  tom: TomDaMesa
  /** A terceira linha: o dono, "Reservada", "Sua mesa". */
  legenda?: string | null
}

interface Props {
  salao: PlantaDoSalao
  /** Só as mesas que estão no mapa. */
  mesas: MesaNoMapa[]
  /** Nome do mapa para o leitor de tela. */
  rotulo: string
  /** 1 é o mapa na largura da caixa; 1,5 é 50% maior, com rolagem. */
  zoom?: number
  selecionado?: Selecao | null
  /** Sem ele o mapa é só de ler: nada se seleciona nem se arrasta. */
  aoSelecionar?: (selecao: Selecao | null) => void
  /** O ponto novo, em centímetros e ainda cru: quem chama encaixa na grade e no salão. */
  aoMover?: (selecao: Selecao, ponto: Ponto) => void
  aoRedimensionar?: (indice: number, tamanho: Tamanho) => void
  className?: string
}

interface Arrasto {
  alvo: Selecao
  modo: 'mover' | 'redimensionar'
  /** Distância do ponteiro à origem do item, para ele não "pular" para baixo do cursor. */
  folga: Ponto
}

/**
 * O salão desenhado em SVG, com o centímetro como unidade do `viewBox`.
 *
 * Um componente só para o editor da Gestão e o mapa de leitura do formando: a diferença é ter ou não
 * `aoSelecionar`. O arraste é por Pointer Events no próprio SVG — mouse, caneta e dedo pelo mesmo
 * caminho, sem biblioteca —, e as setas do teclado movem o item escolhido de 20 em 20 cm (com Shift,
 * de metro em metro).
 *
 * O tamanho das letras acompanha o salão, e não a tela: num salão de 24 m a letra tem 40 cm, e
 * continua legível quando o mapa encolhe para caber no celular.
 */
export function MapaDoSalao({
  salao,
  mesas,
  rotulo,
  zoom = 1,
  selecionado,
  aoSelecionar,
  aoMover,
  aoRedimensionar,
  className,
}: Props) {
  const idDaGrade = useId()
  const svg = useRef<SVGSVGElement>(null)
  const arrasto = useRef<Arrasto | null>(null)
  const editavel = !!aoSelecionar
  const letra = Math.max(salao.largura, salao.altura) / 60
  const parede = Math.max(8, letra / 3)

  const noSalao = (evento: PointerEvent): Ponto => {
    const matriz = svg.current?.getScreenCTM()?.inverse()
    if (!matriz) return { x: 0, y: 0 }
    const ponto = new DOMPoint(evento.clientX, evento.clientY).matrixTransform(matriz)
    return { x: ponto.x, y: ponto.y }
  }

  const origem = (alvo: Selecao): Ponto | null => {
    if (alvo.tipo === 'mesa') return mesas.find((mesa) => mesa.id === alvo.id) ?? null
    return salao.elementos[alvo.indice] ?? null
  }

  const pegar = (evento: PointerEvent, alvo: Selecao, modo: Arrasto['modo']) => {
    if (!editavel || evento.button !== 0) return
    evento.stopPropagation()
    aoSelecionar(alvo)
    const inicio = modo === 'mover' ? origem(alvo) : null
    const ponteiro = noSalao(evento)
    arrasto.current = {
      alvo,
      modo,
      folga: inicio ? { x: ponteiro.x - inicio.x, y: ponteiro.y - inicio.y } : { x: 0, y: 0 },
    }
    svg.current?.setPointerCapture(evento.pointerId)
  }

  const arrastar = (evento: PointerEvent) => {
    const atual = arrasto.current
    if (!atual) return
    const ponteiro = noSalao(evento)

    if (atual.modo === 'mover') {
      aoMover?.(atual.alvo, { x: ponteiro.x - atual.folga.x, y: ponteiro.y - atual.folga.y })
    } else if (atual.alvo.tipo === 'elemento') {
      const elemento = salao.elementos[atual.alvo.indice]
      if (elemento)
        aoRedimensionar?.(atual.alvo.indice, {
          largura: ponteiro.x - elemento.x,
          altura: ponteiro.y - elemento.y,
        })
    }
  }

  const soltar = () => {
    arrasto.current = null
  }

  const teclar = (evento: KeyboardEvent, alvo: Selecao) => {
    const passo = evento.shiftKey ? METRO : GRADE
    const direcao = {
      ArrowLeft: { x: -passo, y: 0 },
      ArrowRight: { x: passo, y: 0 },
      ArrowUp: { x: 0, y: -passo },
      ArrowDown: { x: 0, y: passo },
    }[evento.key]

    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      aoSelecionar?.(alvo)
      return
    }

    const inicio = origem(alvo)
    if (!direcao || !inicio) return
    evento.preventDefault()
    aoSelecionar?.(alvo)
    aoMover?.(alvo, { x: inicio.x + direcao.x, y: inicio.y + direcao.y })
  }

  const interativo = (alvo: Selecao, nome: string) =>
    editavel
      ? {
          role: 'button',
          tabIndex: 0,
          'aria-label': nome,
          'aria-pressed': ehSelecionado(selecionado, alvo),
          className: 'cursor-grab touch-none outline-none focus-visible:[&>.foco]:opacity-100!',
          onPointerDown: (evento: PointerEvent) => pegar(evento, alvo, 'mover'),
          onKeyDown: (evento: KeyboardEvent) => teclar(evento, alvo),
        }
      : {}

  const elementos = salao.elementos.map((elemento, indice) => ({ elemento, indice }))
  const areas = elementos.filter(({ elemento }) => elemento.tipo === 'Area')
  const resto = elementos.filter(({ elemento }) => elemento.tipo !== 'Area')

  const desenharElemento = ({ elemento, indice }: { elemento: ElementoDoSalao; indice: number }) => {
    const alvo: Selecao = { tipo: 'elemento', indice }
    const escolhido = ehSelecionado(selecionado, alvo)
    const alca = letra * 0.7

    return (
      <g
        key={`elemento-${indice}`}
        {...interativo(alvo, `${elemento.rotulo}, ${ELEMENTOS_DO_SALAO[elemento.tipo].rotulo}`)}
      >
        {editavel ? null : <title>{elemento.rotulo}</title>}
        <rect
          x={elemento.x}
          y={elemento.y}
          width={elemento.largura}
          height={elemento.altura}
          rx={Math.min(24, elemento.largura / 4, elemento.altura / 4)}
          strokeWidth={parede / 2}
          strokeDasharray={elemento.tipo === 'Area' ? `${letra / 2} ${letra / 3}` : undefined}
          className={
            elemento.tipo === 'Area'
              ? CORES_DA_AREA[elemento.cor ?? 'Cinza'].desenho
              : 'fill-neutral-bg stroke-muted-foreground/30'
          }
        />
        <ConteudoDoElemento elemento={elemento} letra={letra} />
        <Moldura
          x={elemento.x}
          y={elemento.y}
          largura={elemento.largura}
          altura={elemento.altura}
          escolhido={escolhido}
          espessura={parede / 2}
        />
        {escolhido && aoRedimensionar ? (
          <rect
            role="presentation"
            x={elemento.x + elemento.largura - alca / 2}
            y={elemento.y + elemento.altura - alca / 2}
            width={alca}
            height={alca}
            rx={alca / 4}
            className="fill-card stroke-brand cursor-nwse-resize touch-none"
            strokeWidth={parede / 2}
            onPointerDown={(evento) => pegar(evento, alvo, 'redimensionar')}
          />
        ) : null}
      </g>
    )
  }

  return (
    <svg
      ref={svg}
      viewBox={`${-parede} ${-parede} ${salao.largura + parede * 2} ${salao.altura + parede * 2}`}
      role={editavel ? 'group' : 'img'}
      aria-label={rotulo}
      style={{ width: `${zoom * 100}%` }}
      className={cn('block h-auto select-none', className)}
      onPointerDown={editavel ? () => aoSelecionar(null) : undefined}
      onPointerMove={editavel ? arrastar : undefined}
      onPointerUp={editavel ? soltar : undefined}
      onPointerCancel={editavel ? soltar : undefined}
    >
      <defs>
        <pattern id={idDaGrade} width={METRO} height={METRO} patternUnits="userSpaceOnUse">
          <circle cx={METRO / 2} cy={METRO / 2} r={letra / 10} className="fill-muted-foreground/25" />
        </pattern>
      </defs>

      <rect
        x={0}
        y={0}
        width={salao.largura}
        height={salao.altura}
        className="fill-card stroke-foreground/60"
        strokeWidth={parede}
      />
      <rect x={0} y={0} width={salao.largura} height={salao.altura} fill={`url(#${idDaGrade})`} />

      {areas.map(desenharElemento)}
      {resto.map(desenharElemento)}

      {mesas.map((mesa) => {
        const alvo: Selecao = { tipo: 'mesa', id: mesa.id }
        const tampo = tampoDaMesa(mesa)
        const escolhida = ehSelecionado(selecionado, alvo)
        const alcance = (mesa.formato === 'Redonda' ? tampo.largura / 2 : 0) + CADEIRA + 8
        const cores = TONS[mesa.tom]
        const nome = [mesa.identificacao, `${mesa.lugares} lugares`, mesa.legenda].filter(Boolean).join(', ')

        return (
          <g key={mesa.id} {...interativo(alvo, nome)}>
            {editavel ? null : <title>{nome}</title>}
            {cadeirasDaMesa(mesa).map((cadeira, indice) => (
              <rect
                key={indice}
                x={mesa.x + cadeira.x - CADEIRA / 2}
                y={mesa.y + cadeira.y - CADEIRA / 2}
                width={CADEIRA}
                height={CADEIRA}
                rx={CADEIRA / 4}
                strokeWidth={3}
                className={cores.cadeira}
              />
            ))}
            {mesa.formato === 'Redonda' ? (
              <circle cx={mesa.x} cy={mesa.y} r={tampo.largura / 2} strokeWidth={4} className={cores.tampo} />
            ) : (
              <rect
                x={mesa.x - tampo.largura / 2}
                y={mesa.y - tampo.altura / 2}
                width={tampo.largura}
                height={tampo.altura}
                rx={12}
                strokeWidth={4}
                className={cores.tampo}
              />
            )}
            <TextoDaMesa mesa={mesa} tampo={tampo} letra={letra} />
            <Moldura
              x={mesa.x - (mesa.formato === 'Redonda' ? alcance : tampo.largura / 2 + CADEIRA + 8)}
              y={mesa.y - (mesa.formato === 'Redonda' ? alcance : tampo.altura / 2 + CADEIRA + 8)}
              largura={mesa.formato === 'Redonda' ? alcance * 2 : tampo.largura + (CADEIRA + 8) * 2}
              altura={mesa.formato === 'Redonda' ? alcance * 2 : tampo.altura + (CADEIRA + 8) * 2}
              escolhido={escolhida}
              espessura={parede / 2}
            />
          </g>
        )
      })}
    </svg>
  )
}

const TONS: Record<TomDaMesa, { tampo: string; cadeira: string }> = {
  dono: { tampo: 'fill-brand-tint stroke-brand', cadeira: 'fill-brand-wash stroke-brand-soft' },
  reservada: {
    tampo: 'fill-evento-festa/20 stroke-evento-festa',
    cadeira: 'fill-card stroke-evento-festa/60',
  },
  livre: { tampo: 'fill-card stroke-muted-foreground/60', cadeira: 'fill-card stroke-muted-foreground/40' },
}

function ehSelecionado(selecionado: Selecao | null | undefined, alvo: Selecao) {
  if (!selecionado || selecionado.tipo !== alvo.tipo) return false
  return selecionado.tipo === 'mesa'
    ? selecionado.id === (alvo as { id: string }).id
    : selecionado.indice === (alvo as { indice: number }).indice
}

/**
 * O retângulo tracejado do item escolhido. Fora da escolha fica invisível, e aparece no foco do
 * teclado — quem navega por Tab precisa ver onde está.
 */
function Moldura({
  escolhido,
  espessura,
  ...caixa
}: {
  x: number
  y: number
  largura: number
  altura: number
  escolhido: boolean
  espessura: number
}) {
  return (
    <rect
      x={caixa.x - espessura * 2}
      y={caixa.y - espessura * 2}
      width={caixa.largura + espessura * 4}
      height={caixa.altura + espessura * 4}
      rx={espessura * 3}
      fill="none"
      strokeWidth={espessura}
      strokeDasharray={`${espessura * 3} ${espessura * 2}`}
      className={cn('foco stroke-brand pointer-events-none', escolhido ? 'opacity-100' : 'opacity-0')}
    />
  )
}

/** Ícone e nome do elemento: empilhados quando há altura, lado a lado na faixa baixa (entrada, bar). */
function ConteudoDoElemento({ elemento, letra }: { elemento: ElementoDoSalao; letra: number }) {
  const cx = elemento.x + elemento.largura / 2
  const cy = elemento.y + elemento.altura / 2

  if (elemento.tipo === 'Area') {
    return (
      <text
        x={elemento.x + letra / 2}
        y={elemento.y + letra * 1.3}
        fontSize={letra}
        className="fill-foreground/70 pointer-events-none font-medium"
      >
        {elemento.rotulo}
      </text>
    )
  }

  const Icone = ELEMENTOS_DO_SALAO[elemento.tipo].icone
  const icone = Math.min(letra * 2, Math.min(elemento.largura, elemento.altura) * 0.45)
  const empilhado = elemento.altura >= icone + letra * 2.2

  if (empilhado) {
    return (
      <g className="pointer-events-none">
        <Icone
          x={cx - icone / 2}
          y={cy - icone / 2 - letra * 0.6}
          width={icone}
          height={icone}
          strokeWidth={1.5}
          className="text-muted-foreground"
          aria-hidden
        />
        <text
          x={cx}
          y={cy + icone / 2 + letra * 0.4}
          fontSize={letra * 1.1}
          textAnchor="middle"
          className="fill-muted-foreground font-medium"
        >
          {elemento.rotulo}
        </text>
      </g>
    )
  }

  const fonte = Math.min(letra * 1.1, elemento.altura * 0.5)
  const texto = elemento.rotulo.length * fonte * 0.55
  const iconeNaFaixa = Math.min(icone, fonte * 1.3)
  const inicio = cx - (texto + iconeNaFaixa + fonte / 3) / 2

  return (
    <g className="pointer-events-none">
      <Icone
        x={inicio}
        y={cy - iconeNaFaixa / 2}
        width={iconeNaFaixa}
        height={iconeNaFaixa}
        strokeWidth={1.5}
        className="text-muted-foreground"
        aria-hidden
      />
      <text
        x={inicio + iconeNaFaixa + fonte / 3}
        y={cy}
        fontSize={fonte}
        dominantBaseline="central"
        className="fill-muted-foreground font-medium"
      >
        {elemento.rotulo}
      </text>
    </g>
  )
}

/**
 * Nome, lugares e a legenda no tampo. A letra encolhe na mesa pequena, e a legenda longa ("Beatriz
 * Correia Prado Braga") fica só com o primeiro e o último nome. Na retangular em pé o texto gira
 * junto.
 */
function TextoDaMesa({ mesa, tampo, letra }: { mesa: MesaNoMapa; tampo: Tamanho; letra: number }) {
  const deitado = mesa.formato === 'Retangular' && mesa.girada
  const largura = deitado ? tampo.altura : tampo.largura
  const altura = deitado ? tampo.largura : tampo.altura
  const linhas = [
    mesa.identificacao,
    `${mesa.lugares} lugares`,
    mesa.legenda ? encurtarNome(mesa.legenda) : null,
  ].filter((linha): linha is string => !!linha)
  const cabem = altura < letra * 2.6 ? linhas.slice(0, 2) : linhas
  const fonte = Math.min(letra, (altura * 0.8) / (cabem.length + 0.4), largura / 5)
  const topo = mesa.y - ((cabem.length - 1) * fonte * 1.15) / 2

  return (
    <g className="pointer-events-none" transform={deitado ? `rotate(-90 ${mesa.x} ${mesa.y})` : undefined}>
      {cabem.map((linha, indice) => (
        <text
          key={indice}
          x={mesa.x}
          y={topo + indice * fonte * 1.15}
          fontSize={indice === 0 ? fonte : fonte * 0.8}
          textAnchor="middle"
          dominantBaseline="central"
          className={indice === 0 ? 'fill-foreground font-semibold' : 'fill-muted-foreground'}
        >
          {linha}
        </text>
      ))}
    </g>
  )
}

/** "Beatriz Correia Prado Braga" → "Beatriz Braga": cabe no tampo e ainda diz quem é. */
function encurtarNome(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return partes.length > 2 ? `${partes[0]} ${partes[partes.length - 1]}` : nome
}
