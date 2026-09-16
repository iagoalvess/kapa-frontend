import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { formatarCentavos } from '@/lib/formato'
import { CampoDeMoeda } from './CampoDeMoeda'

function Campo({ inicial = 0 }: { inicial?: number }) {
  const [centavos, definir] = useState(inicial)

  return (
    <>
      <CampoDeMoeda aria-label="Valor" value={centavos} onChange={definir} />
      <output>{centavos}</output>
    </>
  )
}

describe('CampoDeMoeda', () => {
  it('digita da direita para a esquerda e entrega centavos inteiros', async () => {
    render(<Campo />)

    await userEvent.type(screen.getByLabelText('Valor'), '35000')

    expect(screen.getByLabelText('Valor')).toHaveValue(formatarCentavos(35000))
    expect(screen.getByRole('status')).toHaveTextContent('35000')
  })

  it('apagar tira o último dígito', async () => {
    render(<Campo inicial={35000} />)

    await userEvent.type(screen.getByLabelText('Valor'), '{Backspace}')

    expect(screen.getByRole('status')).toHaveTextContent('3500')
  })

  it('ignora letras e símbolos', async () => {
    render(<Campo />)

    await userEvent.type(screen.getByLabelText('Valor'), '1a2,-3')

    expect(screen.getByRole('status')).toHaveTextContent('123')
  })
})
