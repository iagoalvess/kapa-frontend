import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { InfoDoCampo } from './InfoDoCampo'

const explicacao = 'A última parcela não pode vencer depois desta data.'

function montar() {
  render(
    <TooltipProvider>
      <InfoDoCampo sobre="Último vencimento">{explicacao}</InfoDoCampo>
    </TooltipProvider>,
  )
  return screen.getByRole('button', { name: 'Mais sobre Último vencimento' })
}

describe('InfoDoCampo', () => {
  it('mostra a explicação ao passar o mouse', async () => {
    await userEvent.hover(montar())

    expect(await screen.findByRole('tooltip')).toHaveTextContent(explicacao)
  })

  /** No toque não há hover: o clique abre, e não fecha o que acabou de abrir. */
  it('mostra a explicação no toque', async () => {
    // Toque, e não `click`: o `click` do user-event passa o mouse por cima antes, e o hover abriria sozinho.
    await userEvent.pointer({ keys: '[TouchA]', target: montar() })

    expect(await screen.findByRole('tooltip')).toHaveTextContent(explicacao)
  })
})
