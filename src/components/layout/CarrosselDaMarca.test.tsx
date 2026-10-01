import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CarrosselDaMarca } from './CarrosselDaMarca'

function mostrarMeta(movimentoReduzido = false) {
  vi.stubGlobal('matchMedia', () => ({
    matches: movimentoReduzido,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
  })
  const resultado = render(<CarrosselDaMarca />)
  fireEvent.click(screen.getByRole('button', { name: 'Destaque 3: Sua festa está tomando forma' }))
  return resultado
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('meta do carrossel', () => {
  it('avança até 100% e só então revela a festa e solta os confetes', () => {
    const { container } = mostrarMeta()
    expect(screen.getByText('72%')).toBeInTheDocument()
    expect(screen.getByText('Festa').parentElement).toHaveClass('invisible')
    expect(container.querySelector('.meta-confete')).toBeNull()

    act(() => vi.advanceTimersByTime(500))
    const percentual = Number(screen.getByText(/^\d+%$/).textContent?.replace('%', ''))
    expect(percentual).toBeGreaterThan(72)
    expect(percentual).toBeLessThan(100)
    expect(screen.getByText('Festa').parentElement).toHaveClass('invisible')

    act(() => vi.advanceTimersByTime(1400))
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Festa').parentElement).not.toHaveClass('invisible')
    expect(container.querySelector('.meta-confete')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Destaque 1: Cadastre a sua turma' }))
    fireEvent.click(screen.getByRole('button', { name: 'Destaque 3: Sua festa está tomando forma' }))
    expect(screen.getByText('72%')).toBeInTheDocument()
    expect(screen.getByText('Festa').parentElement).toHaveClass('invisible')
  })

  it('mostra a meta concluída e a festa sem confetes quando o movimento é reduzido', () => {
    const { container } = mostrarMeta(true)
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Festa').parentElement).not.toHaveClass('invisible')
    expect(container.querySelector('.meta-confete')).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })
})
