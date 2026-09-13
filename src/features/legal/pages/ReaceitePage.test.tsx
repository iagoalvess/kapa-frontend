import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PERFIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import ReaceitePage from './ReaceitePage'

const MEUS_ACEITES = `${env.VITE_API_URL}/api/v1/legal/meus-aceites`
const ACEITES = `${env.VITE_API_URL}/api/v1/legal/aceites`

/** Re-aceite com um destino de verdade, para ver a tela sair dele depois do aceite. */
function renderizarReaceite() {
  const router = createMemoryRouter(
    [
      { path: ROTAS.aceitePendente, element: <ReaceitePage /> },
      { path: ROTAS.membros, element: <p>tela de destino</p> },
    ],
    { initialEntries: [{ pathname: ROTAS.aceitePendente, state: { de: ROTAS.membros } }] },
  )

  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('ReaceitePage', () => {
  beforeEach(() => {
    const corpo = btoa(
      JSON.stringify({ sub: 'u-1', name: 'Ana', email: 'ana@exemplo.com', role: [PERFIS.usuario] }),
    )
    sessao.autenticar({ accessToken: `c.${corpo}.a`, expiraEm: new Date(Date.now() + 900_000).toISOString() })
  })

  afterEach(() => sessao.encerrar())

  it('pede só o documento pendente e, aceito, devolve ao destino', async () => {
    let pendencias = [{ tipo: 'TermosDeUso', versao: '2' }]
    let aceito: unknown
    servidor.use(
      http.get(MEUS_ACEITES, () => HttpResponse.json({ historico: [], pendencias })),
      http.post(ACEITES, async ({ request }) => {
        aceito = await request.json()
        pendencias = []
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderizarReaceite()

    await userEvent.click(await screen.findByRole('checkbox', { name: /Termos de Uso/ }))
    expect(screen.queryByRole('checkbox', { name: /Política de Privacidade/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Aceitar e continuar' }))

    expect(await screen.findByText('tela de destino')).toBeInTheDocument()
    expect(aceito).toEqual({ aceites: [{ tipo: 'TermosDeUso', versao: '2' }] })
  })

  it('não envia sem marcar o aceite', async () => {
    servidor.use(
      http.get(MEUS_ACEITES, () =>
        HttpResponse.json({ historico: [], pendencias: [{ tipo: 'PoliticaDePrivacidade', versao: '3' }] }),
      ),
    )

    renderizarReaceite()
    await userEvent.click(await screen.findByRole('button', { name: 'Aceitar e continuar' }))

    expect(await screen.findByText('É preciso aceitar para continuar.')).toBeInTheDocument()
  })
})
