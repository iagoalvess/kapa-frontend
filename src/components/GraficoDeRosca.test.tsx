import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GraficoDeRosca } from './GraficoDeRosca'
import { GraficoVazio } from './GraficoVazio'

describe('Gráficos de rosca sem dados', () => {
  it.each([{ fatias: [] }, { fatias: [{ chave: 'buffet', rotulo: 'Buffet', valor: 0 }] }])(
    'mostra uma mensagem sem gráfico quando não há fatias positivas: %j',
    ({ fatias }) => {
      const { container } = render(<GraficoDeRosca fatias={fatias} />)
      expect(screen.getByText('Nenhum dado para exibir.')).toBeInTheDocument()
      expect(container.querySelector('svg')).toBeNull()
      expect(container.querySelector('img')).toBeNull()
    },
  )

  it('o estado vazio específico mostra somente a frase', () => {
    const { container } = render(<GraficoVazio forma="rosca">Nenhuma saída no período.</GraficoVazio>)
    expect(screen.getByText('Nenhuma saída no período.')).toBeInTheDocument()
    expect(container.childElementCount).toBe(1)
    expect(container.firstElementChild?.tagName).toBe('P')
  })

  it('continua mostrando as fatias com valores positivos', () => {
    const { container } = render(
      <GraficoDeRosca
        fatias={[
          { chave: 'buffet', rotulo: 'Buffet', valor: 100_000 },
          { chave: 'banda', rotulo: 'Banda', valor: 0 },
        ]}
      />,
    )
    expect(screen.getByText('Buffet')).toBeInTheDocument()
    expect(screen.queryByText('Banda')).not.toBeInTheDocument()
    expect(container.querySelectorAll('circle')).toHaveLength(1)
  })
})
