import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EsqueletoDeGrafico, EsqueletoDeTabela, EsqueletoDeTexto } from './Esqueleto'

/**
 * O que se testa aqui é o contrato com o leitor de tela e a contagem de blocos — o desenho em si é
 * CSS. Um esqueleto mudo é o pior dos dois mundos: nem mostra conteúdo, nem diz que ele vem.
 */
describe('Esqueleto', () => {
  it('anuncia o carregamento uma vez por bloco', () => {
    render(<EsqueletoDeTexto linhas={4} />)

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getAllByText('Carregando…')).toHaveLength(1)
  })

  it('desenha a grade pedida: o cabeçalho mais uma linha por item', () => {
    const { container } = render(<EsqueletoDeTabela linhas={3} colunas={4} />)

    // 4 do cabeçalho + 3 linhas × 4 colunas.
    expect(container.querySelectorAll('[aria-hidden]')).toHaveLength(4 + 3 * 4)
  })

  it('troca de forma sem trocar de componente', () => {
    const { container: barras } = render(<EsqueletoDeGrafico />)
    const { container: rosca } = render(<EsqueletoDeGrafico forma="rosca" />)

    expect(barras.querySelector('.rounded-full')).toBeNull()
    expect(rosca.querySelector('.rounded-full')).not.toBeNull()
  })
})
