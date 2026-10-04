import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { MapaDeMesas, Mesa } from '../types/mesas.types'
import MapaDasMesasPage from './MapaDasMesasPage'

const MESAS = `${env.VITE_API_URL}/api/v1/festa/mesas`
const FORMATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual`

const livre: Mesa = {
  id: 'm-1',
  identificacao: 'Mesa 1',
  lugares: 10,
  observacao: 'Perto da pista',
  reservada: false,
  vinculo_id: null,
  dono: null,
  formato: 'Redonda',
  x: null,
  y: null,
  girada: false,
}

const daAna: Mesa = {
  ...livre,
  id: 'm-2',
  identificacao: 'Mesa 2',
  observacao: null,
  vinculo_id: 'v-ana',
  dono: 'Ana Souza',
  x: 600,
  y: 400,
}

const dosPais: Mesa = {
  ...livre,
  id: 'm-3',
  identificacao: 'Mesa dos pais',
  lugares: 12,
  observacao: null,
  reservada: true,
}

const mapa: MapaDeMesas = {
  mesas: 3,
  lugares: 32,
  reservadas: 1,
  com_dono: 1,
  mesas_por_atribuir: 2,
  lista: [livre, daAna, dosPais],
  compradores: [{ vinculo_id: 'v-ana', nome: 'Ana Souza', compradas: 1, atribuidas: 1 }],
  salao: {
    largura: 2400,
    altura: 1600,
    elementos: [{ tipo: 'Palco', rotulo: 'Palco', x: 800, y: 0, largura: 600, altura: 260, cor: null }],
  },
}

describe('MapaDasMesasPage', () => {
  afterEach(() => sessao.encerrar())

  it('a mesa fora do mapa vai para o salão num clique, e só o "Salvar mapa" grava', async () => {
    entrarComo('Comissao')
    const saloes: unknown[] = []
    servidor.use(
      http.get(MESAS, () => HttpResponse.json(mapa)),
      http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
      http.put(`${MESAS}/salao`, async ({ request }) => {
        saloes.push(await request.json())

        return new HttpResponse(null, { status: 204 })
      }),
    )
    const usuario = userEvent.setup()

    renderizar(<MapaDasMesasPage />)

    const salvar = await screen.findByRole('button', { name: 'Salvar mapa' })
    expect(salvar).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Aumentar' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Largura em metros')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mesa 2, 10 lugares, Ana Souza' })).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Divisória' }))
    expect(screen.getByRole('button', { name: 'Divisória, Divisória' })).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /^Mesa 1/ }))

    // A divisória nova e a mesa ainda não foram gravadas.
    expect(screen.getByRole('button', { name: 'Mesa 1, 10 lugares, Perto da pista' })).toBeInTheDocument()
    expect(saloes).toEqual([])

    await usuario.click(salvar)

    await expect
      .poll(() => saloes)
      .toEqual([
        {
          elementos: [
            { tipo: 'Palco', rotulo: 'Palco', x: 800, y: 0, largura: 600, altura: 260, cor: null },
            { tipo: 'Divisoria', rotulo: 'Divisória', x: 1060, y: 780, largura: 300, altura: 40, cor: null },
          ],
          posicoes: [{ mesa_id: 'm-1', x: 1300, y: 900, girada: false }],
        },
      ])
  })
})
