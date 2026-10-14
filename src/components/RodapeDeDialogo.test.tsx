import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RodapeDeDialogo } from './RodapeDeDialogo'

/**
 * Os fontes como texto, para a guarda de convenção abaixo. O `import.meta.glob` do Vite dispensa o
 * `node:fs` (que o `tsconfig` do app, de navegador, não conhece) e resolve no build do Vitest.
 */
const fontes = import.meta.glob<string>('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const colunas = () => document.querySelector('[data-slot="rodape-de-dialogo"]')?.firstElementChild

describe('RodapeDeDialogo', () => {
  /**
   * A geometria é o que te irritava: "Cancelar/Salvar" com largura e alinhamento diferentes de tela
   * para tela. Este teste é o cadeado — mexer nela derruba aqui, e não numa revisão de olho.
   */
  it('o par fica em duas colunas iguais, encostado à direita', () => {
    render(
      <RodapeDeDialogo>
        <button type="button">Cancelar</button>
        <button type="button">Salvar</button>
      </RodapeDeDialogo>,
    )

    expect(document.querySelector('[data-slot="rodape-de-dialogo"]')).toHaveClass('flex', 'justify-end')
    expect(colunas()).toHaveClass('grid', 'grid-cols-2', 'w-fit')
    expect(colunas()).not.toHaveClass('w-full')
  })

  it('o botão único fica sozinho à direita, sem a coluna do par', () => {
    render(
      <RodapeDeDialogo variante="unico">
        <button type="button">Fechar</button>
      </RodapeDeDialogo>,
    )

    expect(colunas()).not.toHaveClass('grid-cols-2')
  })
})

describe('rodapé do diálogo', () => {
  /**
   * Todo diálogo do app desenha o rodapé pelo `RodapeDeDialogo` — o do formulário
   * (`AcoesDoFormulario`), o da confirmação e os de leitura. O `AlertDialogFooter` do shadcn ficou
   * para trás justamente porque tinha outra geometria; se ele voltar a aparecer numa tela, o par
   * volta a ficar de dois jeitos. A exceção é o próprio primitivo, em `components/ui`.
   */
  it('nenhuma tela usa o AlertDialogFooter do shadcn fora de components/ui', () => {
    const infratores = Object.entries(fontes)
      .filter(([caminho]) => !caminho.split('/').includes('ui'))
      .filter(([caminho]) => !caminho.includes('.test.'))
      .filter(([, conteudo]) => conteudo.includes('AlertDialogFooter'))
      .map(([caminho]) => caminho)

    expect(infratores).toEqual([])
  })
})
