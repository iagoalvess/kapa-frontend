import { screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import type { Pedido } from '@/features/cobrancas'
import { parcelaDeTeste } from '@/features/pagamentos/dadosDeTeste'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import type { Parcela } from '@/types/cobranca'
import PaginaDosMeusPedidos from './PaginaDosMeusPedidos'

const pedido: Pedido = {
  id: 'pe-1',
  item_de_cobranca_id: 'i-1',
  tipo: 'ConviteExtra',
  descricao: 'Convite extra',
  usuario_id: 'u-1',
  nome: 'Ana',
  quantidade: 1,
  parcelas: 2,
  valor_unitario_em_centavos: 18000,
  total_em_centavos: 18000,
  pago_em_centavos: 0,
  quitado: false,
  status: 'Confirmado',
  pedido_em: '2026-09-05T12:00:00Z',
  cancelado_em: null,
}

function servir(parcelas: Parcela[]) {
  servidor.use(
    http.get(`${env.VITE_API_URL}/api/v1/pedidos/meus`, () =>
      HttpResponse.json([pedido, { ...pedido, id: 'pe-2', item_de_cobranca_id: 'i-2', status: 'Cancelado' }]),
    ),
    http.get(`${env.VITE_API_URL}/api/v1/cobrancas/opcionais`, () => HttpResponse.json([])),
    http.get(`${env.VITE_API_URL}/api/v1/extrato/eu`, () =>
      HttpResponse.json({ parcelas, proxima: null, em_aberto_em_centavos: 18000 }),
    ),
  )
}

describe('Pagamento do resumo de pedidos', () => {
  it('leva ao PIX só parcelas disponíveis dos pedidos confirmados', async () => {
    servir([
      parcelaDeTeste({ id: 'aberta' }),
      parcelaDeTeste({ id: 'vencida', status: 'Vencida' }),
      parcelaDeTeste({ id: 'conferencia', em_conferencia: true }),
      parcelaDeTeste({ id: 'paga', status: 'Paga' }),
      parcelaDeTeste({ id: 'cancelada', status: 'Cancelada' }),
      parcelaDeTeste({ id: 'pedido-cancelado', item_de_cobranca_id: 'i-2' }),
      parcelaDeTeste({ id: 'mensalidade', item_de_cobranca_id: 'i-3' }),
    ])
    renderizar(<PaginaDosMeusPedidos />)
    const pagar = await screen.findByRole('link', { name: 'Pagar com PIX' })
    const destino = new URL(pagar.getAttribute('href')!, 'http://localhost')
    expect(destino.searchParams.get('parcelas')).toBe('aberta,vencida')
  })

  it('não oferece outro pagamento quando todas as parcelas estão em conferência', async () => {
    servir([parcelaDeTeste({ em_conferencia: true })])
    renderizar(<PaginaDosMeusPedidos />)
    expect(await screen.findByText(/Nenhuma parcela disponível para pagar agora/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Pagar com PIX' })).not.toBeInTheDocument()
  })
})
