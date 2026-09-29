import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CaixaRolavel } from './CaixaRolavel'

describe('CaixaRolavel', () => {
  /** A seta que diz "tem mais" também leva até lá: clicar rola quase uma caixa inteira para baixo. */
  it('com conteúdo sobrando, a seta rola a caixa para baixo', async () => {
    render(
      <CaixaRolavel>
        <p>Parcelas</p>
      </CaixaRolavel>,
    )
    const caixa = screen.getByText('Parcelas').parentElement!.parentElement!
    // O jsdom não mede nada: a caixa finge 100px à vista de 500px de conteúdo.
    Object.defineProperties(caixa, {
      scrollHeight: { value: 500 },
      clientHeight: { value: 100 },
    })
    caixa.scrollBy = () => {}
    const rolar = vi.spyOn(caixa, 'scrollBy')

    fireEvent.scroll(caixa)
    await userEvent.click(await screen.findByRole('button', { name: 'Ver mais' }))

    expect(rolar).toHaveBeenCalledWith(expect.objectContaining({ top: 80 }))
  })
})
