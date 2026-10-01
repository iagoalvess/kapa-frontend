import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { createMemoryRouter, Outlet } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { expect, it } from 'vitest'
import { VoltaDaPagina } from '@/components/VoltaDaPagina'
import { env } from '@/config/env'
import { ROTAS } from '@/config/rotas'
import { TermoAssinado } from '@/features/adesoes/components/TermoAssinado'
import type { Adesao } from '@/features/adesoes/types/adesoes.types'
import MeuExtratoPage from '@/features/pagamentos/pages/MeuExtratoPage'
import { servidor } from '@/test/msw/server'

const adesao: Adesao = {
  id: 'ad-1',
  versao: 1,
  aceito_em: '2026-09-14T13:32:05Z',
  hash_do_conteudo: 'a'.repeat(64),
  nome_completo: 'Ana Souza',
  cpf: '52998224725',
  email_do_aceite: 'ana@kapa.dev',
  conteudo_do_termo: '# Termo\n\nA turma contrata a formatura.',
  plano: {
    percentual_de_multa: 200,
    percentual_de_juros_ao_mes: 100,
    carencia_em_dias: 0,
    percentual_de_desconto_por_antecipacao: 0,
    dias_minimos_para_desconto: 0,
    itens: [],
    parcelas: [],
    total_em_centavos: 0,
  },
}

it('Ver minhas parcelas no termo assinado oferece a seta para retornar ao Meu termo', async () => {
  servidor.use(
    http.get(`${env.VITE_API_URL}/api/v1/extrato/eu`, () =>
      HttpResponse.json({ parcelas: [], proxima: null, em_aberto_em_centavos: 0 }),
    ),
  )
  const router = createMemoryRouter(
    [
      {
        element: (
          <VoltaDaPagina>
            <Outlet />
          </VoltaDaPagina>
        ),
        children: [
          {
            path: ROTAS.adesao,
            handle: { titulo: 'Meu termo' },
            element: <TermoAssinado adesao={adesao} />,
          },
          {
            path: ROTAS.extrato,
            handle: { titulo: 'Minhas parcelas' },
            element: <MeuExtratoPage />,
          },
        ],
      },
    ],
    { initialEntries: [`${ROTAS.adesao}?ler=assinada`] },
  )
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={cliente}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  await userEvent.click(screen.getByRole('link', { name: 'Ver minhas parcelas' }))
  const volta = screen.getByRole('link', { name: 'Meu termo' })
  expect(volta).toHaveAttribute('href', `${ROTAS.adesao}?ler=assinada`)
  expect(volta.querySelector('svg')).toBeInTheDocument()
  await userEvent.click(volta)
  expect(router.state.location.pathname + router.state.location.search).toBe(`${ROTAS.adesao}?ler=assinada`)
  expect(screen.getByRole('link', { name: 'Ver minhas parcelas' })).toBeInTheDocument()
})
