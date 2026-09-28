import { CircleAlert, CircleCheck, CircleX } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ResultadoDaValidacao as Resultado } from '../lib/resultadoDaValidacao'

const TONS = {
  entrou: { classe: 'bg-success-bg text-success-text', Icone: CircleCheck },
  barrado: { classe: 'bg-danger-bg text-danger-text', Icone: CircleX },
  aviso: { classe: 'bg-warning-bg text-warning-text', Icone: CircleAlert },
} as const

/**
 * O resultado da validação, grande: quem está na porta lê de relance, em pé e com fila na frente.
 *
 * `<output>` para o leitor de tela anunciar sem roubar o foco do botão.
 *
 * @param resultado O que `resultadoDaValidacao` traduziu.
 */
export function ResultadoDaValidacao({ resultado, className }: { resultado: Resultado; className?: string }) {
  const { classe, Icone } = TONS[resultado.tom]

  return (
    <output className={cn('grid justify-items-center gap-2 rounded-2xl p-5 text-center', classe, className)}>
      <Icone className="size-10" aria-hidden />
      <p className="text-xl font-semibold">{resultado.titulo}</p>
      {resultado.detalhe ? <p className="text-sm">{resultado.detalhe}</p> : null}
    </output>
  )
}
