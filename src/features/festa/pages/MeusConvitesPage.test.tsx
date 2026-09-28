import { screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { EventoDoConvite } from '@/types/festa'
import type { MeuConvite, MeusConvites } from '../types/convites.types'
import MeusConvitesPage from './MeusConvitesPage'

const MEUS = `${env.VITE_API_URL}/api/v1/festa/convites/meus`

const evento = (tipo: EventoDoConvite['tipo'], titulo: string, data: string): EventoDoConvite => ({
  id: `ev-${tipo}`,
  tipo,
  titulo,
  data,
  hora: '19:00:00',
  local: 'Centro',
  completo: true,
  fechamento_da_lista: '2099-01-01T00:00:00Z',
  janela_abre_em: '2099-01-01T00:00:00Z',
  janela_fecha_em: '2099-01-02T00:00:00Z',
})

const convite = (id: string, nome: string | null): MeuConvite => ({
  id,
  sequencial: 1,
  codigo: `MED27-${id}`,
  token: nome ? `MED27-${id}-XXXXXXXX` : null,
  nome_do_convidado: nome,
  tipo_do_documento: null,
  documento: null,
  email_do_convidado: null,
  emitido_em: '2027-09-23T12:00:00Z',
  validado_em: null,
})

const meus = (partes: Partial<MeusConvites>): MeusConvites => ({
  evento: null,
  lista_aberta: true,
  convites: [],
  aguardando_pagamento: 0,
  ...partes,
})

describe('MeusConvitesPage', () => {
  beforeEach(() => entrarComo('Formando'))
  afterEach(() => sessao.encerrar())

  it('separa os convites por evento, a colação antes da festa, e soma os dois no topo', async () => {
    servidor.use(
      http.get(MEUS, ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get('tipo') === 'Colacao'
            ? meus({
                evento: evento('Colacao', 'Colação de grau', '2027-12-10'),
                convites: [convite('AAAA', null), convite('BBBB', 'Tia Rosa')],
              })
            : meus({
                evento: evento('Festa', 'Festa de formatura', '2027-12-11'),
                convites: [convite('CCCC', null)],
              }),
        ),
      ),
    )
    renderizar(<MeusConvitesPage />)

    const titulos = await screen.findAllByRole('heading', { name: /Colação de grau|Festa de formatura/ })
    expect(titulos.map((titulo) => titulo.textContent)).toEqual(['Colação de grau', 'Festa de formatura'])
    expect(screen.getByText('Tia Rosa')).toBeInTheDocument()
    expect(screen.getAllByText('Convidado a definir')).toHaveLength(2)
  })

  it('convite a definir só se nomeia: o link aparece com o convidado', async () => {
    servidor.use(
      http.get(MEUS, ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get('tipo') === 'Colacao'
            ? meus({})
            : meus({
                evento: evento('Festa', 'Festa de formatura', '2027-12-11'),
                convites: [convite('AAAA', null), convite('BBBB', 'Tia Rosa')],
              }),
        ),
      ),
    )
    renderizar(<MeusConvitesPage />)

    const lista = await screen.findByRole('list', { name: 'Convites: Festa de formatura' })
    const [aDefinir, nomeado] = within(lista).getAllByRole('listitem') as [HTMLElement, HTMLElement]
    expect(within(aDefinir).getByRole('button', { name: 'Nomear' })).toBeInTheDocument()
    expect(within(aDefinir).queryByRole('button', { name: 'Copiar link' })).not.toBeInTheDocument()
    expect(within(aDefinir).queryByRole('link', { name: 'Abrir' })).not.toBeInTheDocument()
    expect(within(nomeado).getByRole('link', { name: 'Abrir' })).toHaveAttribute(
      'href',
      expect.stringContaining('MED27-BBBB-XXXXXXXX'),
    )
  })

  it('sem convite nenhum, diz de onde cada um vem', async () => {
    servidor.use(http.get(MEUS, () => HttpResponse.json(meus({}))))
    renderizar(<MeusConvitesPage />)

    expect(
      await screen.findByText(/Os da colação aparecem aqui quando a comissão abrir a cota/),
    ).toBeInTheDocument()
  })
})
