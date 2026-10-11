import { screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, reais, renderizar } from '@/test/utils'
import { AdimplenciaEFornecedores } from './AdimplenciaEFornecedores'

function comPagamento(pago: number) {
  entrarComo('Comissao')
  servidor.use(
    http.get(`${env.VITE_API_URL}/api/v1/dashboard/publico`, () =>
      HttpResponse.json({
        adimplencia: {
          devido_em_centavos: 0,
          recebido_em_centavos: 0,
          em_atraso_em_centavos: 0,
          percentual_base_dez_mil: 10_000,
        },
        por_fornecedor: [
          {
            fornecedor_id: 'f-1',
            nome: 'Buffet Sabor',
            quantidade: 1,
            pago_em_centavos: pago,
            previsto_em_centavos: 200_000,
          },
        ],
      }),
    ),
  )
  renderizar(<AdimplenciaEFornecedores />)
}

describe('Pago por fornecedor', () => {
  afterEach(() => sessao.encerrar())

  it('mostra a mensagem quando há fornecedores cadastrados sem pagamentos', async () => {
    comPagamento(0)
    expect(await screen.findByText(/Nada saiu para fornecedor ainda/)).toBeInTheDocument()
    const cartao = screen.getByRole('heading', { name: 'Pago por fornecedor' }).closest('section')!
    expect(cartao.querySelector('img')).toBeNull()
    expect(cartao.querySelector('circle')).toBeNull()
  })

  it('mostra a pizza quando há pagamentos', async () => {
    comPagamento(100_000)
    expect(await screen.findByText('Buffet Sabor')).toBeInTheDocument()
    expect(screen.getByText(reais(100_000))).toBeInTheDocument()
    expect(screen.queryByText(/Nada saiu para fornecedor ainda/)).not.toBeInTheDocument()
  })
})
