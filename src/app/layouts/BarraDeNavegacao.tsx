import { useNavigation } from 'react-router'

/**
 * A barra fina no topo enquanto a próxima tela carrega.
 *
 * As telas chegam sob demanda (`lazy` no roteador): entre o clique e a tela nova há um intervalo em que nada mudava,
 * e quem clicava em "Pagar" achava que o clique não tinha pegado (06/10/2026). A barra só aparece depois de um
 * instante — navegação que resolve na hora não pisca nada.
 */
export function BarraDeNavegacao() {
  const navegando = useNavigation().state !== 'idle'

  if (!navegando) return null

  return (
    <div
      // Só visual: o leitor de tela já anuncia a página nova quando ela chega.
      aria-hidden
      data-barra-de-navegacao=""
      className="fixed inset-x-0 top-0 z-50 h-[3px]"
    />
  )
}
