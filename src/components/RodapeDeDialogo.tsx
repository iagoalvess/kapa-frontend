import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  /**
   * `duplo` é o par desistir/principal em duas colunas iguais — o rodapé de todo formulário e de toda
   * confirmação. `unico` é o diálogo que só se fecha (leitura), com um botão só.
   */
  variante?: 'duplo' | 'unico'
  children: ReactNode
}

/**
 * O rodapé de **todo** diálogo do app: os botões encostados à direita, da largura do maior, sem
 * esticar pelo cartão.
 *
 * É a geometria que o `AcoesDoFormulario` (o par de um formulário), o `DialogoDeConfirmacao` (por
 * dentro do `AlertDialog`) e os diálogos de leitura compartilham (Sprint 55). Antes cada um desenhava
 * o seu — o par do formulário em duas colunas, o do `AlertDialog` em largura desigual, uns esticados
 * e outros à direita —, e "Cancelar/Salvar" mudava de lugar conforme a tela.
 *
 * Não tem lógica, só o desenho. O `data-slot` é o contrato: o `DialogoDeFormulario` o usa para prender
 * o rodapé no pé da área que rola, e o teste de contrato o lê para a geometria não regredir.
 */
export function RodapeDeDialogo({ variante = 'duplo', children }: Props) {
  return (
    <div data-slot="rodape-de-dialogo" className="flex justify-end">
      <div className={cn('grid w-fit max-w-full gap-2', variante === 'duplo' && 'grid-cols-2')}>
        {children}
      </div>
    </div>
  )
}
