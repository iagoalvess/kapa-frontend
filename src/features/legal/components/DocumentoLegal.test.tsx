import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DocumentoLegal } from './DocumentoLegal'

describe('DocumentoLegal', () => {
  it('renderiza títulos, listas e tabelas do markdown', () => {
    render(
      <DocumentoLegal
        conteudo={
          '# Termos\n\n## 1. Seção\n\n- um\n- dois\n\n| Finalidade | Base legal |\n| --- | --- |\n| Conta | Contrato |'
        }
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Termos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '1. Seção' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('cell', { name: 'Contrato' })).toBeInTheDocument()
  })

  /** O texto vem do banco: marcação tem de virar texto, nunca HTML executável. */
  it('não interpreta HTML embutido', () => {
    render(<DocumentoLegal conteudo={'Operada por **Kapa** <img src=x onerror=alert(1)>'} />)

    expect(screen.getByText('Kapa').tagName).toBe('STRONG')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('abre links em nova aba', () => {
    render(<DocumentoLegal conteudo="Veja [a ANPD](https://www.gov.br/anpd)." />)

    expect(screen.getByRole('link', { name: 'a ANPD' })).toHaveAttribute('target', '_blank')
  })
})
