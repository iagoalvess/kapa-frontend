import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * As cores do registro escolhido, em toda lista do app: o laranja claro da marca com a barra à
 * esquerda. Vale para o item aberto no mestre-detalhe (mural, festa) e para a linha marcada num
 * lote (conferência, pagar várias parcelas) — quem aplica a borda (`border-l-2`) é quem desenha.
 */
export const COR_ESCOLHIDA = 'bg-brand-tint border-brand'
export const COR_NAO_ESCOLHIDA = 'hover:bg-border/40 border-transparent'

/** O `<th>` da primeira coluna, alinhado com a barra e o respiro que a `LinhaSelecionavel` dá à dela. */
export const PRIMEIRA_COLUNA_SELECIONAVEL = 'border-l-2 border-transparent pl-3'

/** Clique que nasceu num controle da própria linha (campo, botão) é dele, não da seleção. */
const CONTROLE = 'a, button, input, select, textarea, label'

interface Props {
  selecionada: boolean
  aoAlternar: () => void
  /** Uma `<td>`/`<th>` por coluna, como numa `<tr>` comum. */
  children: ReactNode
  className?: string
}

/**
 * Uma `<tr>` que se marca e desmarca pelo clique em qualquer ponto dela, sem caixa de marcar.
 *
 * Pelo teclado, a linha entra no Tab e alterna com Espaço ou Enter; o leitor de tela ouve o estado
 * por `aria-selected`. Clique em controle da linha e clique vindo de um diálogo aberto por ela (o
 * React sobe o evento pelo portal) não alternam.
 */
export function LinhaSelecionavel({ selecionada, aoAlternar, children, className }: Props) {
  const clicar = (evento: MouseEvent<HTMLTableRowElement>) => {
    const alvo = evento.target as Element
    if (!evento.currentTarget.contains(alvo) || alvo.closest(CONTROLE)) return
    aoAlternar()
  }

  const teclar = (evento: KeyboardEvent<HTMLTableRowElement>) => {
    if (evento.target !== evento.currentTarget || (evento.key !== ' ' && evento.key !== 'Enter')) return
    evento.preventDefault()
    aoAlternar()
  }

  return (
    <tr
      tabIndex={0}
      aria-selected={selecionada}
      onClick={clicar}
      onKeyDown={teclar}
      className={cn(
        'focus-visible:outline-ring cursor-pointer border-b outline-none last:border-0 focus-visible:outline-2 focus-visible:-outline-offset-2',
        // A barra mora na primeira célula: `<tr>` não desenha borda lateral com a tabela colapsada.
        '[&>:first-child]:border-l-2 [&>:first-child]:pl-3',
        selecionada
          ? '[&>:first-child]:border-brand bg-brand-tint'
          : 'hover:bg-border/40 [&>:first-child]:border-transparent',
        // Na lista do celular (`Tabela emLista`) a linha é um bloco, e a barra passa para ela: na
        // primeira célula, que ali é só a linha do título, ela ficaria pela metade.
        'max-lg:border-l-2 max-lg:pl-3 max-lg:[&>:first-child]:border-l-0',
        selecionada ? 'max-lg:border-l-brand' : 'max-lg:border-l-transparent',
        className,
      )}
    >
      {children}
    </tr>
  )
}
