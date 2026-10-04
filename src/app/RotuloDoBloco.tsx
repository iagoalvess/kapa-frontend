import type { ReactNode } from 'react'

/**
 * O rótulo em caixa-alta que abre cada bloco do Início — o fio que separa é da moldura, não dele.
 *
 * Mora num arquivo próprio porque o Início importa os blocos que também precisam dele (primeiros
 * passos, aviso de cadastro); importá-lo de `PaginaInicial` criaria um ciclo.
 *
 * @param id Nome do bloco: `aria-labelledby` da seção aponta para ele.
 */
export function Rotulo({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-muted-foreground text-[11px] font-bold tracking-[.08em] uppercase">
      {children}
    </h2>
  )
}
