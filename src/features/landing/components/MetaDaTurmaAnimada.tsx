import { useEffect, useRef, useState } from 'react'
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
      className={cn('relative', grande ? 'py-3.5 max-[374px]:py-2.5' : 'w-full max-w-60', className)}
    >
      <span className="sr-only">Meta da turma: R$ 48.000. 100% alcançados, R$ 48.000 arrecadados.</span>
      {/* A pequena mora numa folha pautada: cada linha tem a altura da pauta (20px), sem vão entre elas,
          para o texto assentar nas linhas. */}
      <div className={cn('grid', grande && 'gap-2.5')} aria-hidden>
        <div className="grid min-w-0">
          <span
            className={cn(
              'font-hand text-brand-text',
              grande ? 'text-lg leading-none' : 'text-base leading-5',
            )}
          >
            Meta da turma
          </span>
          <strong
            className={cn(
              'text-foreground font-extrabold tracking-tight whitespace-nowrap',
              grande ? 'mt-1 text-3xl leading-tight max-[374px]:text-xl' : 'text-2xl leading-10',
            )}
          >
            R$ 48.000
          </strong>
        </div>
        <div className={cn('flex items-center', grande ? 'gap-2.5' : 'h-5 gap-2')}>
          <div className="relative min-w-0 flex-1">
            <div className="bg-brand-tint h-1.5 overflow-hidden rounded-full">
              <div className="bg-brand-hover h-full rounded-full" style={{ width: `${progresso}%` }} />
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
            grande ? 'text-xs' : 'text-[9px] leading-5 sm:text-[10px]',
          )}
        >
          R$ {formatarNumero(Math.round((META * progresso) / 100))} arrecadados
        </span>
        {grande ? (
          <span className="font-hand text-success-text -rotate-2 text-base leading-none">
            uma turma inteira construindo esse sonho
          </span>
        ) : null}
      </div>
    </div>
  )
}
