import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import MinhaPrivacidadePage from './MinhaPrivacidadePage'

const MEUS_DADOS = `${env.VITE_API_URL}/api/v1/privacidade/meus-dados`
const SOLICITACOES = `${env.VITE_API_URL}/api/v1/privacidade/solicitacoes`
const REVOGAR = `${env.VITE_API_URL}/api/v1/privacidade/consentimentos/c-1/revogar`

/** O titular de duas turmas: é o caso que a decisão 2 da Sprint 14 existe para cobrir. */
const dados = {
  conta: {
    id: 'u-9',
    nome: 'Pedro Alves',
    email: 'pedro@kapa.dev',
    email_confirmado: true,
    telefone: '+5541999990000',
    criado_em: '2026-01-10T12:00:00Z',
    anonimizado_em: null,
  },
  turmas: [
    {
      formatura_id: 'f-1',
      formatura: 'Medicina 2027',
      instituicao: 'UFPR',
      papel: 'Formando',
      ativo: true,
      perfil: {
        nome_completo: 'Pedro Alves',
        nome_no_diploma: null,
        cpf: '39053344705',
        rg: null,
        matricula: null,
        telefone: '+5541999990000',
        data_de_nascimento: null,
        observacoes: null,
        endereco: {
          cep: '80000000',
          logradouro: 'Rua das Flores',
          numero: '100',
          complemento: null,
          bairro: 'Centro',
          cidade: 'Curitiba',
          uf: 'PR',
        },
        contato_de_emergencia: { nome: 'Marta', telefone: null, parentesco: 'mãe' },
        tem_foto: true,
        completude: 90,
      },
      financeiro: { total_em_centavos: 840000, pago_em_centavos: 140000, parcelas: [] },
      adesao: { versao: 2, aceito_em: '2026-02-01T10:00:00Z', endereco_ip: '203.0.113.7' },
    },
    {
      formatura_id: 'f-2',
      formatura: 'Nutrição 2028',
      instituicao: 'PUC',
      papel: 'Presidente',
      ativo: true,
      perfil: null,
      financeiro: { total_em_centavos: 0, pago_em_centavos: 0, parcelas: [] },
      adesao: null,
    },
  ],
  consentimentos: [
    {
      id: 'c-1',
      tipo: 'PoliticaDePrivacidade',
      versao: '1',
      aceito_em: '2026-01-10T12:00:00Z',
      revogado: false,
    },
  ],
  comunicacoes: { preferencias: [], notificacoes_enviadas: 3, ultima_enviada_em: '2026-09-01T09:00:00Z' },
}

describe('MinhaPrivacidadePage', () => {
  beforeEach(() => entrarComo('Formando'))

  afterEach(() => sessao.encerrar())

  it('mostra as duas turmas do titular, e não só a da sessão', async () => {
    servidor.use(
      http.get(MEUS_DADOS, () => HttpResponse.json(dados)),
      http.get(SOLICITACOES, () => HttpResponse.json([])),
    )

    renderizar(<MinhaPrivacidadePage />)

    expect(await screen.findByText('Medicina 2027')).toBeInTheDocument()
    expect(screen.getByText('Nutrição 2028')).toBeInTheDocument()
  })

  it('diz por que cada dado existe e por quanto tempo fica', async () => {
    servidor.use(
      http.get(MEUS_DADOS, () => HttpResponse.json(dados)),
      http.get(SOLICITACOES, () => HttpResponse.json([])),
    )

    renderizar(<MinhaPrivacidadePage />)

    await screen.findByText('Conta')
    expect(screen.getAllByText(/Por quanto tempo fica:/).length).toBeGreaterThan(3)
  })

  it('exporta sem pedir senha', async () => {
    let corpo: unknown
    servidor.use(
      http.get(MEUS_DADOS, () => HttpResponse.json(dados)),
      http.get(SOLICITACOES, () => HttpResponse.json([])),
      http.post(SOLICITACOES, async ({ request }) => {
        corpo = await request.json()
        return HttpResponse.json({ id: 's-1', tipo: 'Exportacao', status: 'Pendente' })
      }),
    )

    renderizar(<MinhaPrivacidadePage />)

    await userEvent.click(await screen.findByRole('button', { name: /exportar meus dados/i }))

    await waitFor(() => expect(corpo).toEqual({ tipo: 'Exportacao' }))
  })

  /**
   * As duas etapas do diálogo. A primeira existe só para a pessoa ler o que vai acontecer — e é a
   * única defesa contra a promessa de apagamento total que a Kapa não pode cumprir.
   */
  it('só pede a senha depois de explicar o que é apagado e o que é preservado', async () => {
    let corpo: unknown
    servidor.use(
      http.get(MEUS_DADOS, () => HttpResponse.json(dados)),
      http.get(SOLICITACOES, () => HttpResponse.json([])),
      http.post(SOLICITACOES, async ({ request }) => {
        corpo = await request.json()
        return HttpResponse.json({ id: 's-2', tipo: 'Exclusao', status: 'Pendente' })
      }),
    )

    renderizar(<MinhaPrivacidadePage />)

    await userEvent.click(await screen.findByRole('button', { name: /solicitar eliminação/i }))

    expect(await screen.findByText('É apagado, para sempre')).toBeInTheDocument()
    expect(screen.getByText('Continua existindo, sem o seu nome')).toBeInTheDocument()
    expect(screen.getByText(/é a prova do contrato que vigorou/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Sua senha')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Entendi, continuar' }))

    await userEvent.type(await screen.findByLabelText('Sua senha'), 'Kapa@2026')
    await userEvent.click(screen.getByRole('button', { name: /^solicitar eliminação$/i }))

    await waitFor(() => expect(corpo).toEqual({ tipo: 'Exclusao', senha: 'Kapa@2026' }))
  })

  it('revoga o consentimento vigente', async () => {
    let revogado = false
    servidor.use(
      http.get(MEUS_DADOS, () => HttpResponse.json(dados)),
      http.get(SOLICITACOES, () => HttpResponse.json([])),
      http.post(REVOGAR, () => {
        revogado = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderizar(<MinhaPrivacidadePage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Revogar' }))

    await waitFor(() => expect(revogado).toBe(true))
  })

  it('mostra o prazo do pedido de eliminação pendente e a porta de desistir', async () => {
    servidor.use(
      http.get(MEUS_DADOS, () => HttpResponse.json(dados)),
      http.get(SOLICITACOES, () =>
        HttpResponse.json([
          {
            id: 's-3',
            tipo: 'Exclusao',
            status: 'Pendente',
            criado_em: '2026-09-17T12:00:00Z',
            prazo_em: '2026-10-02T12:00:00Z',
            confirmada_em: null,
            concluida_em: null,
            expira_em: null,
            disponivel: false,
            motivo: null,
          },
        ]),
      ),
    )

    renderizar(<MinhaPrivacidadePage />)

    const pedido = (await screen.findByText(/Seus dados serão eliminados em 02\/10\/2026/)).closest('li')!

    expect(within(pedido).getByRole('button', { name: 'Desistir do pedido' })).toBeInTheDocument()
    expect(within(pedido).getByRole('button', { name: 'Eliminar agora' })).toBeInTheDocument()
  })
})
