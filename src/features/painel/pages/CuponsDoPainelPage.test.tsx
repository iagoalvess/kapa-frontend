import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import CuponsDoPainelPage from './CuponsDoPainelPage'

const CUPONS = `${env.VITE_API_URL}/api/v1/admin/cupons`

const VALENDO = {
  id: 'c-1',
  codigo: 'PILOTO50',
  percentual: 50,
  valido_ate: '2099-12-31T02:59:59Z',
  limite_de_usos: 3,
  usos: 1,
  ativo: true,
  criado_em: '2026-10-06T12:00:00Z',
}

describe('CuponsDoPainelPage', () => {
  it('lista com a situação, cria e desativa', async () => {
    let lista = [VALENDO, { ...VALENDO, id: 'c-2', codigo: 'ESGOTADO1', usos: 3 }]
    let criado: unknown
    servidor.use(
      http.get(CUPONS, () => HttpResponse.json(lista)),
      http.post(CUPONS, async ({ request }) => {
        criado = await request.json()
        return HttpResponse.json({ ...VALENDO, id: 'c-3', codigo: 'NOVO-10' })
      }),
      http.post(`${CUPONS}/c-1/desativar`, () => {
        lista = lista.map((cupom) => (cupom.id === 'c-1' ? { ...cupom, ativo: false } : cupom))
        return HttpResponse.json(lista[0])
      }),
    )
    const usuario = userEvent.setup()

    renderizar(<CuponsDoPainelPage />)

    expect(await screen.findByText('Valendo')).toBeInTheDocument()
    expect(screen.getByText('Esgotado')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Novo cupom' }))
    await usuario.type(screen.getByLabelText('Código'), 'novo-10')
    await usuario.clear(screen.getByLabelText('Desconto (%)'))
    await usuario.type(screen.getByLabelText('Desconto (%)'), '51')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('O desconto vai de 1% a 50%.')).toBeInTheDocument()

    await usuario.clear(screen.getByLabelText('Desconto (%)'))
    await usuario.type(screen.getByLabelText('Desconto (%)'), '10')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))
    await expect.poll(() => criado).toMatchObject({ codigo: 'NOVO-10', percentual: 10, limite_de_usos: 10 })

    await usuario.click(screen.getByRole('button', { name: 'Desativar PILOTO50' }))
    await usuario.click(await screen.findByRole('button', { name: 'Desativar' }))
    expect(await screen.findByText('Desativado')).toBeInTheDocument()
  })
})
