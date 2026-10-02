import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
})

const convite = (id: string, nome: string | null, extra: Partial<MeuConvite> = {}): MeuConvite => ({
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
  ...extra,
})

const meus = (partes: Partial<MeusConvites>): MeusConvites => ({
  evento: null,
  lista_aberta: true,
  convites: [],
  aguardando_pagamento: 0,
  ...partes,
})

/** A resposta por evento, como a tela pede: uma consulta para a festa, outra para a colação. */
function responderPor(porTipo: { Festa?: MeusConvites; Colacao?: MeusConvites }) {
  servidor.use(
    http.get(MEUS, ({ request }) => {
      const tipo = new URL(request.url).searchParams.get('tipo')
      return HttpResponse.json(porTipo[tipo === 'Colacao' ? 'Colacao' : 'Festa'] ?? meus({}))
    }),
  )
}

/** As linhas do corpo, sem o cabeçalho da tabela. */
function corpo() {
  return screen.getAllByRole('row').slice(1)
}

describe('MeusConvitesPage', () => {
  beforeEach(() => entrarComo('Formando'))
  afterEach(() => sessao.encerrar())

  it('junta os dois eventos numa tabela só, a colação antes da festa, e conta os dois no topo', async () => {
    responderPor({
      Colacao: meus({
        evento: evento('Colacao', 'Colação de grau', '2027-12-10'),
        convites: [convite('AAAA', null), convite('BBBB', 'Tia Rosa')],
      }),
      Festa: meus({
        evento: evento('Festa', 'Festa de formatura', '2027-12-11'),
        convites: [convite('CCCC', null)],
      }),
    })
    renderizar(<MeusConvitesPage />)

    const [colacao, tiaRosa, festa] = (await screen.findAllByRole('row')).slice(1) as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ]
    expect(within(colacao).getByText('Colação de grau')).toBeInTheDocument()
    expect(within(colacao).getByText('Convidado a definir')).toBeInTheDocument()
    expect(within(tiaRosa).getByText('Tia Rosa')).toBeInTheDocument()
    expect(within(festa).getByText('Festa de formatura')).toBeInTheDocument()
    expect(screen.getAllByText('Convidado a definir')).toHaveLength(2)

    const resumo = screen.getByRole('region', { name: 'Resumo dos meus convites' })
    expect(within(resumo).getByText('3')).toBeInTheDocument()
  })

  it('convite a definir só se nomeia: o link aparece com o convidado', async () => {
    responderPor({
      Festa: meus({
        evento: evento('Festa', 'Festa de formatura', '2027-12-11'),
        convites: [convite('AAAA', null), convite('BBBB', 'Tia Rosa')],
      }),
    })
    renderizar(<MeusConvitesPage />)

    await screen.findByText('Tia Rosa')
    const [aDefinir, nomeado] = corpo() as [HTMLElement, HTMLElement]
    expect(within(aDefinir).getByRole('button', { name: 'Nomear' })).toBeInTheDocument()
    expect(within(aDefinir).queryByRole('button', { name: 'Copiar link' })).not.toBeInTheDocument()
    expect(within(aDefinir).queryByRole('link', { name: /Abrir/ })).not.toBeInTheDocument()
    expect(within(nomeado).getByRole('link', { name: 'Abrir o convite MED27-BBBB' })).toHaveAttribute(
      'href',
      expect.stringContaining('MED27-BBBB-XXXXXXXX'),
    )
  })

  it('a busca recorta a lista pelo nome do convidado', async () => {
    responderPor({
      Festa: meus({
        evento: evento('Festa', 'Festa de formatura', '2027-12-11'),
        convites: [convite('AAAA', null), convite('BBBB', 'Tia Rosa')],
      }),
    })
    renderizar(<MeusConvitesPage />)

    await userEvent.type(await screen.findByRole('searchbox', { name: 'Buscar convidado' }), 'rosa{enter}')

    expect(screen.getByText('Tia Rosa')).toBeInTheDocument()
    expect(screen.queryByText('Convidado a definir')).not.toBeInTheDocument()
  })

  it('o filtro de evento isola os convites daquele evento', async () => {
    responderPor({
      Colacao: meus({
        evento: evento('Colacao', 'Colação de grau', '2027-12-10'),
        convites: [convite('AAAA', 'Vovô')],
      }),
      Festa: meus({
        evento: evento('Festa', 'Festa de formatura', '2027-12-11'),
        convites: [convite('BBBB', 'Tia Rosa')],
      }),
    })
    renderizar(<MeusConvitesPage />)

    await userEvent.click(await screen.findByRole('button', { name: /^Festa/ }))

    expect(screen.getByText('Tia Rosa')).toBeInTheDocument()
    expect(screen.queryByText('Vovô')).not.toBeInTheDocument()
  })

  it('o filtro de situação recorta pelo que falta em cada convite', async () => {
    responderPor({
      Festa: meus({
        evento: evento('Festa', 'Festa de formatura', '2027-12-11'),
        convites: [
          convite('AAAA', null),
          convite('BBBB', 'Tia Rosa'),
          convite('CCCC', 'Tio João', { tipo_do_documento: 'Rg', documento: 'RG ••••1234' }),
        ],
      }),
    })
    renderizar(<MeusConvitesPage />)

    await userEvent.click(await screen.findByRole('button', { name: /^Falta o documento/ }))

    expect(screen.getByText('Tia Rosa')).toBeInTheDocument()
    expect(screen.queryByText('Tio João')).not.toBeInTheDocument()
    expect(screen.queryByText('Convidado a definir')).not.toBeInTheDocument()
  })

  it('sem convite nenhum, diz de onde cada um vem', async () => {
    responderPor({})
    renderizar(<MeusConvitesPage />)

    expect(
      await screen.findByText(/Os da colação aparecem aqui quando a comissão abrir a cota/),
    ).toBeInTheDocument()
  })
})
