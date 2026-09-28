import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BotaoDeInstalar } from './BotaoDeInstalar'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

function emCelular(celular = true) {
  vi.stubGlobal('matchMedia', (consulta: string) => ({ matches: celular, media: consulta }))
}

/** O que o Chrome faz quando o site passa a ser instalável. */
function sinalizarInstalacao() {
  const prompt = vi.fn<() => Promise<void>>(() => Promise.resolve())
  act(() => {
    globalThis.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), { prompt }))
  })
  return prompt
}

afterEach(() => {
  // O evento guardado é do módulo: sem isto, um teste herdaria o do anterior.
  act(() => {
    globalThis.dispatchEvent(new Event('appinstalled'))
  })
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('BotaoDeInstalar', () => {
  it('não aparece enquanto o navegador não sinaliza que dá para instalar', () => {
    emCelular()
    render(<BotaoDeInstalar />)
    expect(screen.queryByRole('button', { name: 'Instalar o app' })).not.toBeInTheDocument()
  })

  it('dispara o convite do navegador no clique, uma vez só', async () => {
    emCelular()
    render(<BotaoDeInstalar />)
    const prompt = sinalizarInstalacao()

    await userEvent.click(screen.getByRole('button', { name: 'Instalar o app' }))

    expect(prompt).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Instalar o app' })).not.toBeInTheDocument()
  })

  it('não aparece no computador, mesmo com o navegador sinalizando', () => {
    emCelular(false)
    render(<BotaoDeInstalar />)
    sinalizarInstalacao()
    expect(screen.queryByRole('button', { name: 'Instalar o app' })).not.toBeInTheDocument()
  })

  it('no iPhone mostra a instrução do Safari, em vez de fingir um botão', async () => {
    emCelular()
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE)
    render(<BotaoDeInstalar />)

    await userEvent.click(screen.getByRole('button', { name: 'Instalar o app' }))

    expect(screen.getByText('Adicionar à Tela de Início')).toBeInTheDocument()
  })
})
