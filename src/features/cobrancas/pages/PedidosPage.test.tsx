import { screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { pagina, renderizar } from '@/test/utils'
import PedidosPage from './PedidosPage'

const PEDIDOS = `${env.VITE_API_URL}/api/v1/pedidos`

describe('PedidosPage', () => {
  it('oferece os pedidos pessoais no topo da lista da turma', async () => {
    servidor.use(
      http.get(`${PEDIDOS}/resumo`, () => HttpResponse.json([])),
      http.get(PEDIDOS, () => HttpResponse.json(pagina([]))),
    )

    renderizar(<PedidosPage />)

    expect(await screen.findByText('Nenhum pedido ainda')).toBeInTheDocument()
    // A lateral só aparece depois do carregamento, junto com a lista.
    expect(screen.getByRole('link', { name: 'Ver meus pedidos' })).toHaveAttribute('href', '/meus-pedidos')
  })
})
