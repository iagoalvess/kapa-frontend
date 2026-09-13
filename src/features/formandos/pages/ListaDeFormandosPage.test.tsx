import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import ListaDeFormandosPage from './ListaDeFormandosPage'

const FORMANDOS = `${env.VITE_API_URL}/api/v1/formandos`

const ana = {
  usuarioId: 'u-1',
  nome: 'Ana',
  email: 'ana@exemplo.com',
  papel: 'Formando',
  nomeCompleto: 'Ana Souza',
  completude: 100,
  essencialPendente: false,
}
const bruno = {
  usuarioId: 'u-2',
  nome: 'Bruno',
  email: 'bruno@exemplo.com',
  papel: 'Formando',
  completude: 0,
  essencialPendente: true,
}

const pagina = (itens: unknown[], total = itens.length) => ({
  itens,
  pagina: 1,
  tamanho: 20,
  total,
  totalPaginas: 1,
  temProxima: false,
})

/** Guarda a query de cada listagem; a de `tamanho=1` é a contagem do aviso. */
function registrarListagens(pendentes = 1) {
  const pedidas: URLSearchParams[] = []
  servidor.use(
    http.get(FORMANDOS, ({ request }) => {
      const url = new URL(request.url)
      if (url.searchParams.get('tamanho') === '1') return HttpResponse.json(pagina([bruno], pendentes))
      pedidas.push(url.searchParams)
      return HttpResponse.json(pagina([ana, bruno]))
    }),
  )
  return pedidas
}

describe('ListaDeFormandosPage', () => {
  it('mostra nome civil, completude e quem deve o essencial', async () => {
    registrarListagens()

    renderizar(<ListaDeFormandosPage />)

    expect(await screen.findByRole('link', { name: 'Ana Souza' })).toHaveAttribute(
      'href',
      '/formatura/formandos/u-1',
    )
    expect(screen.getByRole('link', { name: 'Bruno' })).toBeInTheDocument()
    expect(screen.getByText('Completo')).toBeInTheDocument()
    expect(screen.getAllByText('Falta o essencial').length).toBeGreaterThan(0)
  })

  it('avisa quantos ainda não preencheram o essencial e filtra por eles', async () => {
    const pedidas = registrarListagens(3)

    renderizar(<ListaDeFormandosPage />)

    expect(await screen.findByText(/3 formandos ainda não preencheram/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ver quem' }))

    await waitFor(() => expect(pedidas.at(-1)?.get('situacao')).toBe('Pendente'))
    expect(screen.getByRole('button', { name: 'Falta o essencial' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('sem pendentes, não há aviso', async () => {
    registrarListagens(0)

    renderizar(<ListaDeFormandosPage />)

    await screen.findByRole('link', { name: 'Ana Souza' })
    expect(screen.queryByText(/ainda não preench/)).not.toBeInTheDocument()
  })

  it('a busca e a situação vão para a API e voltam à primeira página', async () => {
    const pedidas = registrarListagens()

    renderizar(<ListaDeFormandosPage />, '/?pagina=3')
    await screen.findByRole('link', { name: 'Ana Souza' })

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar formando' }), 'souza')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    await waitFor(() => expect(pedidas.at(-1)?.get('busca')).toBe('souza'))
    expect(pedidas.at(-1)?.get('pagina')).toBe('1')

    await userEvent.click(screen.getByRole('button', { name: 'Completos' }))
    await waitFor(() => expect(pedidas.at(-1)?.get('situacao')).toBe('Completo'))
    expect(pedidas.at(-1)?.get('busca')).toBe('souza')
  })
})
