import type { ReactNode } from 'react'

/**
 * A ação principal da tela, ao alcance do polegar no celular (Sprint 41): presa embaixo, logo acima
 * da barra inferior, na largura da tela e na altura de botão de toque. No computador ela não existe —
 * `contents` devolve o botão ao lugar em que a tela o escreveu, a barra da lista.
 *
 * Só para a tela que tem **uma** ação que é a razão de estar ali (Pagar, Novo aviso, Nova despesa).
 * A moldura (`LayoutApp`) vê o `data-acao-fixa` e estica o respiro de baixo, para a última linha da
 * lista não ficar atrás do botão.
 *
 * @param children O botão — ou o componente que o desenha junto do diálogo que ele abre.
 */
export function AcaoFixa({ children }: { children: ReactNode }) {
  return (
    <div
      data-acao-fixa=""
      className="max-lg:*:shadow-cartao max-lg:fixed max-lg:inset-x-4 max-lg:bottom-[calc(4.75rem+env(safe-area-inset-bottom))] max-lg:z-10 max-lg:grid max-lg:*:h-11 max-lg:*:w-full max-lg:*:text-[15px] lg:contents"
    >
      {children}
    </div>
  )
}
