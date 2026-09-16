import { useEffect, useRef } from 'react'
import { TextoEmMarkdown } from '@/components/TextoEmMarkdown'
import { cn } from '@/lib/utils'

interface Props {
  conteudo: string
  /** Chamado quando o fim do texto aparece na tela — é o que libera o aceite. */
  aoChegarAoFim?: () => void
  className?: string
}

/**
 * O termo inteiro, sem rolagem própria — quem rola é a página —, e um sentinela no rodapé do texto.
 *
 * Quando o sentinela entra na tela, a pessoa rolou até o fim: `IntersectionObserver` contra a
 * janela, sem ouvir `scroll`. Texto curto, que cabe inteiro, libera na hora. É conveniência de
 * produto, não segurança — quem quiser burla; o que vale é que o texto esteve na tela.
 */
export function LeitorDeTermo({ conteudo, aoChegarAoFim, className }: Props) {
  const sentinela = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aoChegarAoFim || !sentinela.current) return

    const observador = new IntersectionObserver((entradas) => {
      if (entradas.some((entrada) => entrada.isIntersecting)) aoChegarAoFim()
    })
    observador.observe(sentinela.current)

    return () => observador.disconnect()
  }, [aoChegarAoFim])

  return (
    <section aria-label="Texto do termo" className={cn('rounded-xl border px-5 py-4', className)}>
      <TextoEmMarkdown conteudo={conteudo} />
      <div ref={sentinela} aria-hidden className="h-px" />
    </section>
  )
}
