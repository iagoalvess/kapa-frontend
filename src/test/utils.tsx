import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, type InitialEntry } from 'react-router'
import { RouterProvider } from 'react-router/dom'

/**
 * Renderiza um componente com roteador e cache próprios.
 *
 * Cada teste ganha um `QueryClient` novo — cache compartilhado faz um teste passar por causa do
 * anterior, e o conjunto quebra assim que alguém roda em outra ordem.
 *
 * @param elemento Componente sob teste.
 * @param rota Caminho inicial do roteador — ou `{ pathname, search, state }` quando a tela lê a
 * query string ou o recado deixado pela tela anterior.
 */
export function renderizar(elemento: ReactElement, rota: InitialEntry = '/') {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  const router = createMemoryRouter([{ path: '*', element: elemento }], {
    initialEntries: [rota],
  })

  return render(
    <QueryClientProvider client={cliente}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}
