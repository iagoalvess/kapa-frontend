import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderizar } from '@/test/utils'
import type { PacoteDoCatalogo } from '../types/adesoes.types'
import { SeletorDeCesta } from './SeletorDeCesta'

const festa: PacoteDoCatalogo = {
  id: 'f15',
  grupo: 'Festa',
  tipo: 'Festa',
  descricao: 'Festa 15',
  valor_em_centavos: 300_000,
  numero_de_parcelas: 10,
  convites_da_festa: 15,
  convites_da_colacao: 0,
  desconto_em_centavos: 300_000,
}
const fotos: PacoteDoCatalogo = {
  ...festa,
  id: 'fotos',
  grupo: null,
  tipo: 'FotoEAlbum',
  descricao: 'Fotos',
  valor_em_centavos: 60_000,
  convites_da_festa: 0,
  desconto_em_centavos: 12_000,
}

describe('SeletorDeCesta com condição financeira (Sprint 54)', () => {
  it('mostra o preço cheio riscado, o líquido, a isenção e o aviso do desconto', () => {
    renderizar(
      <SeletorDeCesta
        catalogo={[festa, fotos]}
        escolha={[]}
        aoMudar={() => {}}
        travada={false}
        comDesconto
      />,
    )

    expect(screen.getByText('Isento')).toBeInTheDocument()
    expect(screen.getByText('R$ 3.000,00')).toHaveClass('line-through')
    expect(screen.getByText('R$ 480,00')).toBeInTheDocument()
    expect(screen.getByText(/A tesouraria concedeu um desconto a você/)).toBeInTheDocument()
  })
})
