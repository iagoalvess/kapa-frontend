import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CampoDeSenha } from './CampoDeSenha'

/**
 * O que se testa é a decisão do olhinho — o que ele troca no campo a cada clique —, e não a
 * posição do ícone, que é CSS.
 */
describe('CampoDeSenha', () => {
  it('esconde a senha e a revela sob demanda', async () => {
    render(<CampoDeSenha aria-label="Senha" defaultValue="segredo" />)

    const campo = screen.getByLabelText('Senha')
    expect(campo).toHaveAttribute('type', 'password')

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(campo).toHaveAttribute('type', 'text')
    expect(campo).toHaveValue('segredo')

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(campo).toHaveAttribute('type', 'password')
  })
})
