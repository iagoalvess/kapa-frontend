import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { reais, renderizar } from '@/test/utils'
import type { Pedido } from '../types/cobrancas.types'
import MeusPedidosPage from './MeusPedidosPage'

const API = env.VITE_API_URL

const pedido = (mudancas: Partial<Pedido> = {}): Pedido => ({
  id: 'pe-1',
  item_de_cobranca_id: 'i-1',
  tipo: 'FotoEAlbum',
  descricao: 'Foto individual',
  usuario_id: 'u-1',
  nome: 'Ana Souza',
  quantidade: 1,
  parcelas: 1,
  total_em_centavos: 35_000,
  pago_em_centavos: 0,
  quitado: false,
  status: 'Confirmado',
  pedido_em: '2026-09-05T12:00:00Z',
  ...mudancas,
})

function servir(meus: Pedido[]) {
  servidor.use(
    http.get(`${API}/api/v1/pedidos/meus`, () => HttpResponse.json(meus)),
    http.get(`${API}/api/v1/cobrancas/opcionais`, () => HttpResponse.json([])),
  )
}

describe('MeusPedidosPage', () => {
  /** O cancelado não soma: ele não é mais dívida de ninguém. */
  it('soma só os pedidos confirmados na faixa', async () => {
    servir([
      pedido({ pago_em_centavos: 10_000 }),
      pedido({ id: 'pe-2', descricao: 'Mesa', tipo: 'Mesa', parcelas: 3, total_em_centavos: 90_000 }),
      pedido({ id: 'pe-3', descricao: 'Convite extra', status: 'Cancelado', total_em_centavos: 18_000 }),
    ])

    renderizar(<MeusPedidosPage />)

    const faixa = await screen.findByRole('region', { name: 'Resumo dos meus pedidos' })
    await waitFor(() => expect(faixa).toHaveTextContent(reais(125_000)))
    expect(faixa).toHaveTextContent(reais(115_000))
  })

  /** Sem opcional aberto, a vitrine já é o convite a pedir: é o conteúdo da tela. */
  it('convida a pedir quando a turma ainda não abriu opcional', async () => {
    servir([])

    renderizar(<MeusPedidosPage />)

    expect(await screen.findByText(/ainda não abriu nenhum opcional/)).toBeInTheDocument()
  })
})
