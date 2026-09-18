import { ChevronDown } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * As classes do `<th>` de um cabeçalho que fica grudado no topo de uma `CaixaRolavel`.
 *
 * Fundo e traço vão na célula, e nunca no `<thead>` ou no `<tr>`: o Tailwind colapsa as bordas da
 * tabela, e borda colapsada pertence à tabela — ela rola embora com as linhas, enquanto o fundo
 * pintado na linha não sela. Dá o cabeçalho solto, com as linhas passando por baixo dele.
 *
 * O traço é `box-shadow` interno pela mesma razão: sobrevive ao colapso e acompanha o cabeçalho.
 */
export const CABECALHO_GRUDADO = 'bg-card py-2 shadow-[inset_0_-1px_0_var(--border)]'

/** Ainda sobra conteúdo abaixo do que está à vista? Um pixel de folga: a rolagem é fracionária. */
const temSobra = (caixa: HTMLDivElement | null) =>
  caixa !== null && caixa.scrollHeight - caixa.scrollTop - caixa.clientHeight > 1

interface Props {
  /** Altura máxima antes de rolar; o padrão é o da lista de parcelas do termo. */
  altura?: string
  className?: string
  children: ReactNode
}

/**
 * A caixa que rola do produto: barra escondida e um degradê com a seta enquanto sobra conteúdo.
 *
 * Nasceu na lista de parcelas do termo de adesão e subiu para cá quando o "pagar várias parcelas"
 * pediu a mesma lista. A seta é o que diz que há mais: sem barra visível, uma lista cortada no meio
 * parece ter acabado ali.
 *
 * Sem padding em cima e embaixo: o cabeçalho grudado e o degradê se prendem ao **content box**, e
 * um `py-` na caixa abre uma faixa por fora deles em que o conteúdo reaparece nítido, cortado no
 * meio. O respiro vertical vem de dentro — do `py-` das células, ou do próprio conteúdo. Nas
 * laterais um `px-` é livre, porque o conteúdo recua junto.
 *
 * Mede-se sozinha, por `ResizeObserver` no conteúdo — a caixa nasce com altura zero dentro de um
 * `<details>` fechado e ganha tamanho ao abrir, e quem usa não deveria ter que avisar.
 */
export function CaixaRolavel({ altura = 'max-h-80', className, children }: Props) {
  const caixa = useRef<HTMLDivElement>(null)
  const conteudo = useRef<HTMLDivElement>(null)
  const [temMais, definirTemMais] = useState(false)

  useEffect(() => {
    const alvo = conteudo.current
    if (!alvo) return

    const observador = new ResizeObserver(() => definirTemMais(temSobra(caixa.current)))
    observador.observe(alvo)

    return () => observador.disconnect()
  }, [])

  return (
    <div
      ref={caixa}
      onScroll={() => definirTemMais(temSobra(caixa.current))}
      className={cn(
        '[scrollbar-width:none] overflow-y-auto [&::-webkit-scrollbar]:hidden',
        altura,
        className,
      )}
    >
      <div ref={conteudo}>{children}</div>

      {/* Altura zero no fluxo (`-mt-10` desfaz o `h-10`): cobre a última linha visível sem mudar a rolagem. */}
      {temMais ? (
        <div
          aria-hidden
          className="from-card pointer-events-none sticky bottom-0 -mt-10 flex h-10 items-end justify-center bg-linear-to-t to-transparent"
        >
          <ChevronDown className="text-muted-foreground size-4" />
        </div>
      ) : null}
    </div>
  )
}
