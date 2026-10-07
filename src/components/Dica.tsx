import { Slot } from '@radix-ui/react-slot'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * O tooltip do design system (`Tooltip`, no laranja da marca) num gatilho só — o balão que as
 * planilhas já usam nos ícones de ação.
 *
 * É o substituto do `title` nativo do navegador: aquele preto, do sistema, que não segue a marca
 * nem o tema, demora a aparecer e não tem foco. Aqui a dica sai no hover e no foco do teclado.
 *
 * @param dica O texto (ou nó) do balão. Ausente, o filho sai como está — a dica só existe quando há
 * o que dizer, como no botão que só explica o porquê quando está desabilitado.
 * @param children O gatilho. Precisa repassar `ref` e props (todo elemento do DOM e os componentes
 * do projeto servem): o `asChild` do Radix clona este filho.
 *
 * Botão desabilitado não recebe o ponteiro, então aqui ele é embrulhado num `<span>` que carrega o
 * hover — como no `AcaoDaLinha`. Use com gatilhos de largura própria (ícone, botão de canto).
 *
 * O resto das props (e a `ref`) vai para o gatilho: dentro de outro `asChild` — o gatilho de um
 * `DialogoDeConfirmacao` —, quem clona a `Dica` passa o `onClick` e a `ref` a ela, e sem repassá-los o
 * clique morria aqui (06/10/2026).
 */
export function Dica({
  dica,
  children,
  className,
  ...gatilho
}: {
  dica?: ReactNode
  children: ReactElement
  /** Ajustes do balão — largura máxima, quebra de texto longo. */
  className?: string
} & ComponentProps<typeof TooltipTrigger>) {
  if (dica === undefined || dica === null || dica === '') return <Slot {...gatilho}>{children}</Slot>

  const desabilitado = Boolean((children.props as { disabled?: boolean }).disabled)

  return (
    <Tooltip>
      <TooltipTrigger asChild {...gatilho}>
        {desabilitado ? <span className="inline-flex">{children}</span> : children}
      </TooltipTrigger>
      <TooltipContent className={className}>{dica}</TooltipContent>
    </Tooltip>
  )
}
