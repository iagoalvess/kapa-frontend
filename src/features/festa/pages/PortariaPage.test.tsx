import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as download from '@/lib/download'
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

  afterEach(() => {
    sessao.encerrar()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('consulta o evento e exporta a lista pela barra no celular', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    const baixar = vi.spyOn(download, 'baixarArquivo').mockImplementation(() => {})
    let eventoExportado: string | null = null
    servidor.use(
      http.get(`${API}/api/v1/festa/portaria/pdf`, ({ request }) => {
        eventoExportado = new URL(request.url).searchParams.get('tipo')
        return new HttpResponse('%PDF-1.7', { headers: { 'Content-Type': 'application/pdf' } })
      }),
    )
    renderizar(<PortariaPage />)
    const barra = await screen.findByRole('navigation', { name: 'Mais nesta área' })
    await userEvent.click(within(barra).getByRole('button', { name: 'Informações do evento' }))
    const dialogo = screen.getByRole('dialog', { name: 'Festa de formatura' })
    expect(dialogo).toHaveTextContent('Espaço Vitrália')
    expect(dialogo).toHaveTextContent('22:00')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Fechar informações' }))
    await userEvent.click(within(barra).getByRole('button', { name: 'Exportar PDF' }))
    await waitFor(() => expect(baixar).toHaveBeenCalledWith(expect.any(Blob), 'lista-da-portaria.pdf'))
    expect(eventoExportado).toBe('Festa')
  })

  it('mostra a contagem, e o detalhe do convite abre ao clicar na linha', async () => {
    renderizar(<PortariaPage />)

    expect(await screen.findByText('Maria Avó')).toBeInTheDocument()

    await userEvent.click(screen.getByText('João Primo'))
    expect(await screen.findByText(/Entrou às .*, por Bruno/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    await userEvent.click(screen.getByText('Carlos Antigo'))
    expect(await screen.findByText('pagamento estornado')).toBeInTheDocument()
  })

  it('a busca filtra a lista já carregada, sem acento e pelo código', async () => {
    renderizar(<PortariaPage />)

    await screen.findByText('Maria Avó')
    await userEvent.type(screen.getByRole('searchbox', { name: 'Procurar convidado' }), 'joao{Enter}')

    expect(screen.getByText('João Primo')).toBeInTheDocument()
    expect(screen.queryByText('Maria Avó')).not.toBeInTheDocument()
  })

  it('o filtro de situação mostra só os daquela situação, com a contagem', async () => {
    renderizar(<PortariaPage />)

    await screen.findByText('Maria Avó')
    await userEvent.click(screen.getByRole('button', { name: 'Entrou 1' }))

    expect(screen.getByText('João Primo')).toBeInTheDocument()
    expect(screen.queryByText('Maria Avó')).not.toBeInTheDocument()
  })

  it('a validação pela linha abre o resultado, e a segunda leitura diz quem validou', async () => {
    servidor.use(
      http.post(`${API}/api/v1/festa/convites/MED27-AAAA/check-in`, () =>
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

    await userEvent.click(await screen.findByRole('button', { name: 'Validar' }))

    expect(await screen.findByText(/^Já validado às/)).toBeInTheDocument()
    expect(screen.getByText(/Por Bruno/)).toBeInTheDocument()
  })

  it('a portaria da colação pede a lista dela e valida com o evento dela', async () => {
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
      http.post(`${API}/api/v1/festa/convites/MED27-KKKK/check-in`, async ({ request }) => {
        eventoDoCheckIn = ((await request.json()) as { evento_id: string | null }).evento_id
        return HttpResponse.json(
          { codigo: 'festa.outro_evento', detail: 'Este convite é de outro evento.' },
          { status: 409 },
        )
      }),
    )
    renderizar(<PortariaPage />)

    await screen.findByText('Maria Avó')
    await userEvent.click(screen.getByRole('button', { name: 'Colação' }))
    expect(await screen.findByText('Tia Rosa')).toBeInTheDocument()
    expect(screen.queryByText('Maria Avó')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Validar' }))

    await screen.findByText(/outro evento/i)
    expect(eventoDoCheckIn).toBe('ev-colacao')
  })

  it('sem internet, oferece registrar a entrada no celular e sincronizar depois', async () => {
    servidor.use(http.post(`${API}/api/v1/festa/convites/MED27-AAAA/check-in`, () => HttpResponse.error()))
    renderizar(<PortariaPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Validar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Registrar entrada no celular' }))

    expect(
      await screen.findByText('1 entrada registrada neste celular, aguardando internet.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sincronizar' })).toBeInTheDocument()
  })
})
