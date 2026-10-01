import { useEffect, useRef, useState } from 'react'
import alvo from '@/assets/outros/alvo.webp'
import { ConfetesDaMeta } from '@/components/ConfetesDaMeta'
import { formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'

const META = 48_000
const PROGRESSO_INICIAL = 72
const PROGRESSO_FINAL = 100
const DURACAO = 1_800

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
        grande ? 'p-3.5 max-[374px]:p-2.5' : 'w-full max-w-60 p-2.5 lg:p-3',
        className,
      )}
    >
      <span className="sr-only">Meta da turma: R$ 48.000. 100% alcançados, R$ 48.000 arrecadados.</span>
      <div className={cn('grid', grande ? 'gap-2.5' : 'gap-2')} aria-hidden>
        <div className={cn('flex items-center', grande ? 'gap-2.5 max-[374px]:gap-1.5' : 'gap-1.5 lg:gap-2')}>
          <img
            src={alvo}
            alt=""
            loading="lazy"
            width={36}
            height={36}
            className={cn('shrink-0', grande ? 'size-9 max-[374px]:size-6' : 'size-6 lg:size-8')}
          />
          <div className="grid min-w-0">
            <span className={cn('text-muted-foreground', grande ? 'text-xs' : 'text-[9px] lg:text-[10px]')}>
              Meta da turma
            </span>
            <strong
              className={cn(
                'text-foreground leading-tight font-extrabold tracking-tight whitespace-nowrap',
                grande ? 'text-xl max-[374px]:text-sm' : 'text-sm lg:text-lg',
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
            {celebrando && <ConfetesDaMeta />}
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
          R$ {formatarNumero(Math.round((META * progresso) / 100))} arrecadados
        </span>
      </div>
    </div>
  )
}
