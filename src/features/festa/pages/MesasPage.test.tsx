import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { MapaDeMesas, Mesa } from '../types/mesas.types'
import MesasPage from './MesasPage'

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
}

const daAna: Mesa = {
  ...livre,
  id: 'm-2',
  identificacao: 'Mesa 2',
  observacao: null,
  vinculo_id: 'v-ana',
  dono: 'Ana Souza',
}

const dosPais: Mesa = {
  ...livre,
  id: 'm-3',
  identificacao: 'Mesa dos pais',
  lugares: 12,
  observacao: null,
  reservada: true,
}

/** Ana comprou uma e já tem; Bruno comprou duas e não tem nenhuma. */
const mapa: MapaDeMesas = {
  mesas: 3,
  lugares: 32,
  reservadas: 1,
  com_dono: 1,
  mesas_por_atribuir: 2,
  lista: [livre, daAna, dosPais],
  compradores: [
    { vinculo_id: 'v-ana', nome: 'Ana Souza', compradas: 1, atribuidas: 1 },
    { vinculo_id: 'v-bruno', nome: 'Bruno Lima', compradas: 2, atribuidas: 0 },
  ],
}

function comApi() {
  const donos: unknown[] = []
  servidor.use(
    http.get(MESAS, () => HttpResponse.json(mapa)),
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
    http.put(`${MESAS}/:id/dono`, async ({ request, params }) => {
      donos.push({ id: params.id, corpo: await request.json() })

      return HttpResponse.json({ ...livre, vinculo_id: 'v-bruno', dono: 'Bruno Lima' })
    }),
  )

  return donos
}

describe('MesasPage', () => {
  afterEach(() => sessao.encerrar())

  it('o seletor de dono só oferece quem ainda tem mesa a receber, e a reservada não tem seletor', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<MesasPage />)

    const seletor = await screen.findByRole('combobox', { name: 'Dono da Mesa 1' })
    const opcoes = within(seletor)
      .getAllByRole('option')
      .map((opcao) => opcao.textContent)
    expect(opcoes).toEqual(['Sem dono', 'Bruno Lima (0 de 2)'])

    // A mesa da Ana continua mostrando a dona, mesmo ela não tendo mais saldo.
    expect(screen.getByRole('combobox', { name: 'Dono da Mesa 2' })).toHaveValue('v-ana')
    expect(screen.queryByRole('combobox', { name: 'Dono da Mesa dos pais' })).not.toBeInTheDocument()
    expect(screen.getByText('Reservada')).toBeInTheDocument()
  })

  it('escolher o dono manda o vínculo do comprador', async () => {
    entrarComo('Comissao')
    const donos = comApi()
    const usuario = userEvent.setup()

    renderizar(<MesasPage />)

    await usuario.selectOptions(await screen.findByRole('combobox', { name: 'Dono da Mesa 1' }), 'v-bruno')

    await expect.poll(() => donos).toEqual([{ id: 'm-1', corpo: { vinculo_id: 'v-bruno' } }])
  })
})
