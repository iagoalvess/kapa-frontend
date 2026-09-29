import type { MouseEvent } from 'react'

/**
 * Fecha o `popover` quando se toca numa ação dentro dele — para o `onClickCapture` da raiz do painel.
 *
 * Os diálogos do app vivem num portal comum, e o painel, na camada de cima, ficaria por cima deles. A
 * exceção é o botão que abre outro painel (`popovertarget`, o link da loja), que precisa deste aberto
 * para existir.
 */
export function fecharPainelAoAgir(evento: MouseEvent<HTMLElement>) {
  const alvo = (evento.target as Element).closest('a, button')
  if (alvo && !alvo.hasAttribute('popovertarget')) evento.currentTarget.hidePopover?.()
}
