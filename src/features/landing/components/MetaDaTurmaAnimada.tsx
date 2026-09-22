import { useEffect, useRef, useState, type CSSProperties } from 'react'
import alvo from '@/assets/outros/alvo.webp'
import { cn } from '@/lib/utils'

const META = 48_000
const PROGRESSO_INICIAL = 72
const PROGRESSO_FINAL = 100
const DURACAO = 1_800
const moeda = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

const CONFETES = [
  { x: -52, y: -32, giro: -180, cor: 'var(--brand)' },
  { x: -38, y: -50, giro: 240, cor: 'var(--success-fill)' },
  { x: -22, y: -42, giro: -220, cor: 'var(--brand-soft)' },
  { x: -8, y: -58, giro: 320, cor: 'var(--brand)' },
  { x: 12, y: -48, giro: -280, cor: 'var(--success-fill)' },
  { x: 30, y: -54, giro: 260, cor: 'var(--brand-soft)' },
  { x: 46, y: -34, giro: -200, cor: 'var(--brand)' },
  { x: 56, y: -18, giro: 320, cor: 'var(--success-fill)' },
  { x: -44, y: -14, giro: 200, cor: 'var(--brand-soft)' },
  { x: 24, y: -24, giro: -320, cor: 'var(--brand)' },
  { x: -14, y: -28, giro: 280, cor: 'var(--success-fill)' },
  { x: 40, y: -12, giro: -240, cor: 'var(--brand-soft)' },
]

/**
 * A meta da turma enchendo até os 100%, com confete no fim.
 *
 * A rolagem só inicia a cena; depois, o tempo controla o avanço e a comemoração.
 *
 * Dois tamanhos, porque duas seções da landing mostram a mesma carta: a do Hero é a peça principal
 * do painel e a de Recursos mora dentro de um cartão pequeno. O que muda é a escala — o número, a
 * animação e o confete são os mesmos, e é justamente isso que se quis reaproveitar.
 *
 * @param grande Escala do Hero. Sem ela, a escala reduzida do cartão de Recursos.
 * @param className Posicionamento de quem chama — recuo, sombra e largura são da moldura, não daqui.
 */
export function MetaDaTurmaAnimada({ grande = false, className }: { grande?: boolean; className?: string }) {
  const cartao = useRef<HTMLDivElement>(null)
  const [progresso, setProgresso] = useState(PROGRESSO_FINAL)
  const [celebrando, setCelebrando] = useState(false)

  useEffect(() => {
    const elemento = cartao.current
    if (!elemento || !window.matchMedia || !('IntersectionObserver' in window)) return

    const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)')
    let quadro = 0
    let iniciou = false

    function concluir() {
      cancelAnimationFrame(quadro)
      setProgresso(PROGRESSO_FINAL)
      setCelebrando(false)
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada) return
        if (!entrada.isIntersecting) {
          iniciou = false
          concluir()
          return
        }
        if (entrada.intersectionRatio < 0.75 || iniciou || movimentoReduzido.matches) return

        iniciou = true
        setCelebrando(false)
        setProgresso(PROGRESSO_INICIAL)
        const inicio = performance.now()

        function avancar(agora: number) {
          const tempo = Math.min((agora - inicio) / DURACAO, 1)
          // Desacelera ao chegar ao valor final, sem salto nem rebote na barra.
          const suavizado = 1 - (1 - tempo) ** 3
          setProgresso(PROGRESSO_INICIAL + (PROGRESSO_FINAL - PROGRESSO_INICIAL) * suavizado)
          if (tempo < 1) {
            quadro = requestAnimationFrame(avancar)
          } else {
            setCelebrando(true)
          }
        }

        quadro = requestAnimationFrame(avancar)
      },
      { threshold: [0, 0.75] },
    )

    function atualizarPreferencia() {
      if (movimentoReduzido.matches) concluir()
    }

    observador.observe(elemento)
    movimentoReduzido.addEventListener('change', atualizarPreferencia)
    return () => {
      cancelAnimationFrame(quadro)
      observador.disconnect()
      movimentoReduzido.removeEventListener('change', atualizarPreferencia)
    }
  }, [])

  return (
    <div
      ref={cartao}
      className={cn(
        'bg-card relative rounded-2xl shadow-md',
        grande ? 'p-3.5' : 'w-full max-w-60 p-2.5 lg:p-3',
        className,
      )}
    >
      <span className="sr-only">Meta da turma: R$ 48.000. 100% alcançados, R$ 48.000 arrecadados.</span>
      <div className={cn('grid', grande ? 'gap-2.5' : 'gap-2')} aria-hidden>
        <div className={cn('flex items-center', grande ? 'gap-2.5' : 'gap-1.5 lg:gap-2')}>
          <img
            src={alvo}
            alt=""
            loading="lazy"
            width={36}
            height={36}
            className={cn('shrink-0', grande ? 'size-9' : 'size-6 lg:size-8')}
          />
          <div className="grid min-w-0">
            <span className={cn('text-muted-foreground', grande ? 'text-xs' : 'text-[9px] lg:text-[10px]')}>
              Meta da turma
            </span>
            <strong
              className={cn(
                'text-foreground leading-tight font-extrabold tracking-tight whitespace-nowrap',
                grande ? 'text-xl' : 'text-sm lg:text-lg',
              )}
            >
              R$ 48.000
            </strong>
          </div>
        </div>
        <div className={cn('flex items-center', grande ? 'gap-2.5' : 'gap-2')}>
          <div className="relative min-w-0 flex-1">
            <div className="bg-muted h-3 overflow-hidden rounded-full">
              <div className="bg-brand h-full rounded-full" style={{ width: `${progresso}%` }} />
            </div>
            {celebrando && (
              <div
                className="pointer-events-none absolute top-1.5 z-10"
                // Recuado o raio da ponta arredondada da barra: a onda sai de dentro dela, não do rótulo ao lado.
                style={{ left: `calc(${PROGRESSO_FINAL}% - 6px)` }}
              >
                <span className="meta-onda border-brand absolute -inset-2 rounded-full border" />
                {CONFETES.map((confete, indice) => (
                  <span
                    key={indice}
                    className="meta-confete absolute h-1.5 w-1 rounded-[1px]"
                    style={
                      {
                        '--confete-x': `${confete.x}px`,
                        '--confete-y': `${confete.y}px`,
                        '--confete-giro': `${confete.giro}deg`,
                        backgroundColor: confete.cor,
                        animationDelay: `${(indice % 4) * 35}ms`,
                        animationDuration: `${1050 + (indice % 3) * 130}ms`,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
            )}
          </div>
          <span
            className={cn(
              'text-foreground shrink-0 text-right font-semibold tabular-nums',
              grande ? 'w-9 text-xs' : 'w-8 text-[10px]',
            )}
          >
            {Math.floor(progresso)}%
          </span>
        </div>
        <span
          className={cn(
            'text-muted-foreground tabular-nums',
            grande ? 'text-xs' : 'text-[9px] sm:text-[10px]',
          )}
        >
          R$ {moeda.format(Math.round((META * progresso) / 100))} arrecadados
        </span>
      </div>
    </div>
  )
}
