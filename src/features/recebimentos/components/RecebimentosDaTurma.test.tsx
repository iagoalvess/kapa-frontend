import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { ContaDeRecebimento, ProvedorConectado } from '../types/recebimentos.types'
import { RecebimentosDaTurma } from './RecebimentosDaTurma'

const CONTA = `${env.VITE_API_URL}/api/v1/recebimentos/conta`
const MERCADO_PAGO = `${CONTA}/mercado-pago`
const conta: ContaDeRecebimento = {
  meios: {
    pix: {
      tipo_de_chave: 'Email',
      chave: 'turma@mp.dev',
      nome_do_titular: 'Helena',
      cidade: 'Curitiba',
      banco: null,
    },
    transferencia: null,
    dinheiro: null,
  },
  atualizada_em: '2026-09-24T12:00:00Z',
  conferida_em: '2026-09-24T12:00:00Z',
  conferida_por: 'Helena',
}
const provedor: ProvedorConectado = {
  conta_no_provedor: 'turma@mp.dev',
  conectado_em: '2026-09-24T12:00:00Z',
  conectado_por: 'Helena',
  cobranca_automatica_em: null,
  cartao: { disponivel: true, ligado_em: null, ligado_por: null, taxa_repassada: null },
}

function comApi(conexao: ProvedorConectado | null = null, meios: ContaDeRecebimento | null = conta) {
  servidor.use(
    http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () =>
      HttpResponse.json({ id: 'f-1', status: 'Ativa' }),
    ),
    http.get(CONTA, () => HttpResponse.json({ conta: meios })),
    http.get(MERCADO_PAGO, () => HttpResponse.json({ provedor: conexao })),
  )
}

describe('RecebimentosDaTurma', () => {
  afterEach(() => sessao.encerrar())

  it('mostra os dois modos antes da conexão e mantém o manual selecionado', async () => {
    entrarComo('Presidente')
    comApi()
    renderizar(<RecebimentosDaTurma />)

    expect(await screen.findByRole('radio', { name: 'Conferência manual' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Confirmação automática' })).toBeEnabled()
    expect(screen.getByRole('heading', { name: /Loja pública/ })).toBeVisible()
    expect(await screen.findByRole('button', { name: 'Conectar Mercado Pago' })).toBeEnabled()
  })

  it('não permite conectar sem a chave PIX e mantém o formulário manual disponível', async () => {
    entrarComo('Presidente')
    comApi(null, null)
    renderizar(<RecebimentosDaTurma />)

    expect(await screen.findByText('Cadastre uma chave PIX antes de conectar.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Conectar Mercado Pago' })).toBeDisabled()
    expect(await screen.findByLabelText('Chave PIX')).toBeVisible()
  })

  it('a conta conectada para a loja não seleciona o pagamento automático dos formandos', async () => {
    entrarComo('Presidente')
    comApi(provedor)
    renderizar(<RecebimentosDaTurma />)

    expect(await screen.findByRole('radio', { name: 'Conferência manual' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Confirmação automática' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Confirmação automática' })).toBeEnabled()
    expect(screen.getByRole('region', { name: 'Loja pública' })).toBeVisible()
    expect(await screen.findByRole('region', { name: 'Meios de pagamento manual' })).toBeVisible()
  })

  it('prepara a conexão ao escolher automático sem ativar a cobrança nem exibir os meios manuais', async () => {
    entrarComo('Presidente')
    comApi()
    let ativacoes = 0
    servidor.use(
      http.put(`${MERCADO_PAGO}/cobranca`, () => {
        ativacoes += 1
        return HttpResponse.json({ provedor })
      }),
    )
    renderizar(<RecebimentosDaTurma />)

    await userEvent.click(await screen.findByRole('radio', { name: 'Confirmação automática' }))
    expect(screen.getByText(/Até lá, o pagamento continua manual/)).toBeVisible()
    expect(screen.getByRole('region', { name: 'Meios de pagamento manual', hidden: true })).not.toBeVisible()
    expect(screen.getByRole('button', { name: 'Conectar Mercado Pago' })).toBeEnabled()
    expect(ativacoes).toBe(0)

    await userEvent.click(screen.getByRole('radio', { name: 'Conferência manual' }))
    expect(await screen.findByRole('region', { name: 'Meios de pagamento manual' })).toBeVisible()
    expect(ativacoes).toBe(0)
  })

  it('recolhe os meios manuais no automático e permite consultá-los e editar', async () => {
    entrarComo('Presidente')
    comApi({ ...provedor, cobranca_automatica_em: '2026-09-29T12:00:00Z' })
    renderizar(<RecebimentosDaTurma />)

    expect(await screen.findByRole('radio', { name: 'Confirmação automática' })).toBeChecked()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Editar', hidden: true })).not.toBeVisible(),
    )
    await userEvent.click(screen.getByText('Meios manuais de reserva'))
    expect(screen.getByRole('button', { name: 'Editar' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(await screen.findByLabelText('Chave PIX')).toBeVisible()
  })

  it('abre os meios de reserva pelo link de edição mesmo no automático', async () => {
    entrarComo('Presidente')
    comApi({ ...provedor, cobranca_automatica_em: '2026-09-29T12:00:00Z' })
    renderizar(<RecebimentosDaTurma />, '/formatura?trocar=meios')

    expect(await screen.findByLabelText('Chave PIX')).toBeVisible()
  })

  it('só troca para o manual depois da confirmação e preserva a conexão da loja', async () => {
    entrarComo('Tesoureiro')
    comApi({ ...provedor, cobranca_automatica_em: '2026-09-29T12:00:00Z' })
    const pedidos: unknown[] = []
    servidor.use(
      http.put(`${MERCADO_PAGO}/cobranca`, async ({ request }) => {
        pedidos.push(await request.json())
        return HttpResponse.json({ provedor })
      }),
    )
    renderizar(<RecebimentosDaTurma />)

    await userEvent.click(await screen.findByRole('radio', { name: 'Conferência manual' }))
    expect(pedidos).toEqual([])
    expect(screen.getByRole('radio', { name: 'Confirmação automática', hidden: true })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Usar manual' }))

    await waitFor(() => expect(screen.getByRole('radio', { name: 'Conferência manual' })).toBeChecked())
    expect(pedidos).toEqual([{ automatica: false }])
    expect(screen.getByText('Conectado')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Loja pública' })).toBeVisible()
  })

  it('em modo de consulta mostra a escolha atual sem permitir alterações', async () => {
    entrarComo('Presidente')
    comApi(provedor)
    servidor.use(
      http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () =>
        HttpResponse.json({ id: 'f-1', status: 'Suspensa' }),
      ),
    )
    renderizar(<RecebimentosDaTurma />)

    await waitFor(() => expect(screen.getByRole('radio', { name: 'Conferência manual' })).toBeDisabled())
    expect(screen.getByRole('radio', { name: 'Confirmação automática' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Trocar de conta' })).not.toBeInTheDocument()
  })
})
