import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { ConviteNaPortaria, ListaDaPortaria } from '../types/convites.types'
import PortariaPage from './PortariaPage'

const API = env.VITE_API_URL

const convite = (
  partes: Partial<ConviteNaPortaria> & Pick<ConviteNaPortaria, 'id' | 'codigo'>,
): ConviteNaPortaria => ({
  evento_id: 'ev-1',
  nome_do_convidado: null,
  documento: null,
  convidado_de: 'Ana Souza',
  origem: 'Comprado',
  situacao: 'Valido',
  motivo_da_revogacao: null,
  entrada: null,
  entrou_sem_rede_duas_vezes: false,
  ...partes,
})

const lista: ListaDaPortaria = {
  evento: {
    id: 'ev-1',
    tipo: 'Festa',
    titulo: 'Festa de formatura',
    data: '2027-12-11',
    hora: '22:00:00',
    local: 'Espaço Vitrália',
    completo: true,
    fechamento_da_lista: '2027-12-11T01:00:00Z',
    janela_abre_em: '2020-01-01T00:00:00Z',
    janela_fecha_em: '2099-01-01T00:00:00Z',
  },
  total: 3,
  validados: 1,
  sem_titular: 1,
  janela_aberta: true,
  gerada_em: '2027-12-12T01:00:00Z',
  convites: [
    convite({ id: 'c-1', codigo: 'MED27-AAAA', nome_do_convidado: 'Maria Avó', documento: 'RG ••••6789' }),
    convite({
      id: 'c-2',
      codigo: 'MED27-BBBB',
      nome_do_convidado: 'João Primo',
      situacao: 'Validado',
      entrada: {
        check_in_id: 'k-1',
        validado_em: '2027-12-12T01:10:00Z',
        validado_por: 'Bruno',
        validado_por_usuario_id: 'u-2',
      },
    }),
    convite({ id: 'c-3', codigo: 'MED27-CCCC', situacao: 'SemTitular' }),
    convite({
      id: 'c-4',
      codigo: 'MED27-DDDD',
      nome_do_convidado: 'Carlos Antigo',
      situacao: 'Revogado',
      motivo_da_revogacao: 'pagamento estornado',
    }),
  ],
}

describe('PortariaPage', () => {
  beforeEach(() => {
    localStorage.clear()
    entrarComo('Comissao')
    servidor.use(
      http.get(`${API}/api/v1/festa/portaria`, () => HttpResponse.json(lista)),
      http.get(`${API}/api/v1/festa/convites/resumo`, () =>
        HttpResponse.json({
          evento: null,
          evento_completo: true,
          emitidos: 3,
          sem_titular: 1,
          pedidos_quitados_sem_convite: 0,
          pedidos_com_parcela_depois_do_fechamento: 0,
        }),
      ),
      http.get(`${API}/api/v1/formaturas/atual`, () =>
        HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' }),
      ),
    )
  })

  afterEach(() => sessao.encerrar())

  it('mostra a contagem e o revogado em vermelho, com o motivo', async () => {
    renderizar(<PortariaPage />)

    expect(await screen.findByText('Maria Avó')).toBeInTheDocument()
    expect(screen.getByText('Revogado: pagamento estornado')).toBeInTheDocument()
    expect(screen.getByText(/Entrou às .*, por Bruno/)).toBeInTheDocument()
  })

  it('a busca filtra a lista já carregada, sem acento e pelo código', async () => {
    renderizar(<PortariaPage />)

    await userEvent.type(await screen.findByRole('textbox', { name: 'Procurar convidado' }), 'joao')

    const itens = screen.getAllByRole('listitem')
    expect(itens).toHaveLength(1)
    expect(within(itens[0]!).getByText('João Primo')).toBeInTheDocument()
  })

  it('o código ditado vale na hora, e a segunda leitura diz quem validou', async () => {
    servidor.use(
      http.post(`${API}/api/v1/festa/convites/MED27-BBBB/check-in`, () =>
        HttpResponse.json(
          {
            codigo: 'festa.ja_validado',
            detail: 'Já validado.',
            dados: {
              check_in_id: 'k-1',
              validado_em: '2027-12-12T01:10:00Z',
              validado_por: 'Bruno',
              validado_por_usuario_id: 'u-2',
            },
          },
          { status: 409 },
        ),
      ),
    )
    renderizar(<PortariaPage />)

    await userEvent.type(await screen.findByRole('textbox', { name: 'Código do convite' }), 'med27-bbbb')
    await userEvent.click(screen.getByRole('button', { name: 'Validar código' }))

    expect(await screen.findByText(/^Já validado às/)).toBeInTheDocument()
    expect(screen.getByText(/Por Bruno/)).toBeInTheDocument()
  })

  it('a portaria da colação pede a lista dela e valida com o evento dela — o convite da festa não passa', async () => {
    let eventoDoCheckIn: unknown = 'não chamado'
    const colacao: ListaDaPortaria = {
      ...lista,
      evento: { ...lista.evento, id: 'ev-colacao', tipo: 'Colacao', titulo: 'Colação de grau' },
      convites: [convite({ id: 'c-9', codigo: 'MED27-KKKK', nome_do_convidado: 'Tia Rosa', origem: 'Cota' })],
    }
    servidor.use(
      http.get(`${API}/api/v1/festa/portaria`, ({ request }) =>
        HttpResponse.json(new URL(request.url).searchParams.get('tipo') === 'Colacao' ? colacao : lista),
      ),
      http.post(`${API}/api/v1/festa/convites/MED27-AAAA/check-in`, async ({ request }) => {
        eventoDoCheckIn = ((await request.json()) as { evento_id: string | null }).evento_id
        return HttpResponse.json(
          { codigo: 'festa.outro_evento', detail: 'Este convite é de outro evento.' },
          { status: 409 },
        )
      }),
    )
    renderizar(<PortariaPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Colação' }))
    expect(await screen.findByText('Tia Rosa')).toBeInTheDocument()
    expect(screen.queryByText('Maria Avó')).not.toBeInTheDocument()

    await userEvent.type(screen.getByRole('textbox', { name: 'Código do convite' }), 'MED27-AAAA')
    await userEvent.click(screen.getByRole('button', { name: 'Validar código' }))

    await screen.findByText(/outro evento/i)
    expect(eventoDoCheckIn).toBe('ev-colacao')
  })

  it('sem rede, oferece marcar a entrada no aparelho e sincronizar depois', async () => {
    servidor.use(http.post(`${API}/api/v1/festa/convites/MED27-AAAA/check-in`, () => HttpResponse.error()))
    renderizar(<PortariaPage />)

    await userEvent.type(await screen.findByRole('textbox', { name: 'Código do convite' }), 'MED27-AAAA')
    await userEvent.click(screen.getByRole('button', { name: 'Validar código' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Marcar entrada sem rede' }))

    expect(await screen.findByText(/1 entrada marcada sem\s+rede neste aparelho/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sincronizar' })).toBeInTheDocument()
  })
})
