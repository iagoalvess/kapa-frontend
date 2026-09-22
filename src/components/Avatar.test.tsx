import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('exibe a inicial da pessoa quando nenhuma foto é informada', () => {
    const { container } = render(<Avatar nome="Ana Clara" semente="Ana" />)

    const span = container.querySelector('span')
    expect(span).not.toBeNull()
    expect(span).toHaveTextContent('A')
    expect(span).toHaveAttribute('aria-hidden', 'true')
  })

  it('exibe a tag img com o caminho da foto quando fornecida', () => {
    const { container } = render(
      <Avatar nome="Ana Clara" semente="Ana" foto="/src/assets/avatares/ana-clara.webp" />,
    )

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img).toHaveAttribute('src', '/src/assets/avatares/ana-clara.webp')
    expect(img).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('span')).toBeNull()
  })
})
