import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Receipt } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { FaixaDeIndicadores } from './FaixaDeIndicadores'

const indicador = (rotulo: string) => ({ rotulo, valor: 1, icone: Receipt })
const terceiro = () => screen.getByText('C').closest('dl')

describe('FaixaDeIndicadores', () => {
  it('guarda do terceiro número em diante atrás de "Ver detalhes" no celular', async () => {
    render(<FaixaDeIndicadores rotulo="Resumo" indicadores={['A', 'B', 'C', 'D'].map(indicador)} />)

    expect(screen.getByText('B').closest('dl')).not.toHaveClass('max-lg:hidden')
    expect(terceiro()).toHaveClass('max-lg:hidden')

    await userEvent.click(screen.getByRole('button', { name: /Ver detalhes/ }))

    expect(terceiro()).not.toHaveClass('max-lg:hidden')
    expect(screen.getByRole('button', { name: /Menos detalhes/ })).toHaveAttribute('aria-expanded', 'true')
  })

  it('não oferece detalhes quando só há dois números', () => {
    render(<FaixaDeIndicadores rotulo="Resumo" indicadores={['A', 'B'].map(indicador)} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
