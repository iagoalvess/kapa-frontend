import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { Cartao } from './Cartao'

afterEach(() => vi.unstubAllGlobals())

it('mantém orientações acessíveis numa seção expansível no celular', async () => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  render(
    <Cartao titulo="Como conferir" recolhivelNoCelular>
      <p>Confira o valor no extrato do banco.</p>
    </Cartao>,
  )

  const orientacao = screen.getByText('Confira o valor no extrato do banco.')
  expect(orientacao).not.toBeVisible()
  await userEvent.click(screen.getByText('Como conferir'))
  expect(orientacao).toBeVisible()
})

it('mantém o guia aberto e a descrição completa no computador', () => {
  const descricao =
    'Confira os pagamentos no extrato do banco antes de confirmar os avisos enviados pelos formandos.'
  render(
    <Cartao titulo="Como conferir" descricao={descricao} recolhivelNoCelular>
      <p>Confira o valor no extrato do banco.</p>
    </Cartao>,
  )
  expect(screen.getByRole('region', { name: 'Como conferir' })).toBeInTheDocument()
  expect(screen.getByText(descricao)).toBeVisible()
})
