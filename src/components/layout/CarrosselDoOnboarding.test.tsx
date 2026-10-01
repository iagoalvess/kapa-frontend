import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CarrosselDoOnboarding } from './CarrosselDoOnboarding'

async function mostrarCaixa(movimentoReduzido = false) {
  const preferencia = {
    matches: movimentoReduzido,
    addEventListener: () => {},
    removeEventListener: () => {},
  }
  vi.stubGlobal('matchMedia', () => preferencia)
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  const resultado = render(<CarrosselDoOnboarding />)
  await usuario.click(screen.getByRole('button', { name: 'Destaque 3: Comece a arrecadar' }))
  return { ...resultado, usuario, preferencia }
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('caixa do carrossel de onboarding', () => {
  it('soma cada contribuição ao aparecer e encerra a sequência sem novos aumentos', async () => {
    await mostrarCaixa()
    expect(screen.getByText('R$ 12.450,00')).toBeInTheDocument()
    expect(screen.getByText('72% da meta da festa')).toBeInTheDocument()
    expect(screen.getByText('Ana Clara').closest('div')).toHaveClass('invisible')
    expect(screen.getByText('Bruno Lima').closest('div')).toHaveClass('invisible')

    act(() => vi.advanceTimersByTime(700))
    expect(screen.getByText('Ana Clara').closest('div')).not.toHaveClass('invisible')
    expect(screen.getByText('Bruno Lima').closest('div')).toHaveClass('invisible')
    expect(screen.getByText('R$ 12.600,00')).toBeInTheDocument()
    expect(screen.getByText('73% da meta da festa')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(800))
    expect(screen.getByText('Bruno Lima').closest('div')).not.toHaveClass('invisible')
    expect(screen.getByText('R$ 12.750,00')).toBeInTheDocument()
    expect(screen.getByText('74% da meta da festa')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(3000))
    expect(screen.getByText('R$ 12.750,00')).toBeInTheDocument()
  })

  it('cancela a sequência ao sair e reinicia o saldo ao voltar ao destaque', async () => {
    const { usuario, unmount } = await mostrarCaixa()
    act(() => vi.advanceTimersByTime(700))
    await usuario.click(screen.getByRole('button', { name: 'Destaque 1: Compartilhe o convite' }))
    expect(vi.getTimerCount()).toBe(1)
    await usuario.click(screen.getByRole('button', { name: 'Destaque 3: Comece a arrecadar' }))
    expect(screen.getByText('R$ 12.450,00')).toBeInTheDocument()
    expect(screen.getByText('Ana Clara').closest('div')).toHaveClass('invisible')
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('exibe o resultado completo sem temporizadores quando o movimento é reduzido', async () => {
    await mostrarCaixa(true)
    expect(screen.getByText('Ana Clara').closest('div')).not.toHaveClass('invisible')
    expect(screen.getByText('Bruno Lima').closest('div')).not.toHaveClass('invisible')
    expect(screen.getByText('R$ 12.750,00')).toBeInTheDocument()
    expect(screen.getByText('74% da meta da festa')).toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
  })
})
