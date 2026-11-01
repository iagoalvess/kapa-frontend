import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, PLANO_GRATUITO, renderizar } from '@/test/utils'
import type { ContaDeRecebimento, ProvedorConectado } from '../types/recebimentos.types'
import { RecebimentosDaTurma } from './RecebimentosDaTurma'

const ATUAL = `${env.VITE_API_URL}/api/v1/formaturas/atual`
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

const semConferir: ContaDeRecebimento = { ...conta, conferida_em: null, conferida_por: null }

const provedor: ProvedorConectado = {
  conta_no_provedor: 'turma@mp.dev',
  conectado_em: '2026-09-24T12:00:00Z',
  conectado_por: 'Helena',
  cobranca_automatica_em: null,
  cartao: { disponivel: true, ligado_em: null, ligado_por: null, taxa_repassada: null },
}

const automatico: ProvedorConectado = { ...provedor, cobranca_automatica_em: '2026-09-29T12:00:00Z' }

interface Cenario {
  meios?: ContaDeRecebimento | null
  conexao?: ProvedorConectado | null
  status?: string
}

/** Declara o que a tela pede; o `PUT` dos meios devolve a conta com o que foi enviado. */
function comApi({ meios = conta, conexao = null, status = 'Ativa' }: Cenario = {}) {
  const gravados: unknown[] = []

  servidor.use(
    http.get(ATUAL, () => HttpResponse.json({ id: 'f-1', status })),
    http.get(CONTA, () => HttpResponse.json({ conta: meios })),
    http.get(MERCADO_PAGO, () => HttpResponse.json({ provedor: conexao })),
    http.get(`${CONTA}/pix-de-teste`, () =>
      HttpResponse.json({ copia_e_cola: '00020126BR.GOV.BCB.PIX', valor_em_centavos: 100 }),
    ),
    http.post(`${CONTA}/conferir`, () =>
      HttpResponse.json({
        ...(meios ?? conta),
        conferida_em: '2026-09-25T10:00:00Z',
        conferida_por: 'Helena',
      }),
    ),
    http.put(CONTA, async ({ request }) => {
      const corpo = (await request.json()) as ContaDeRecebimento['meios']
      gravados.push(corpo)
      return HttpResponse.json({
        conta: { ...(meios ?? conta), meios: corpo, atualizada_em: '2026-09-25T10:00:00Z' },
        confirmacao_enviada_para: null,
      })
    }),
  )

  return gravados
}

describe('RecebimentosDaTurma', () => {
  afterEach(() => sessao.encerrar())

  it('mostra só o resumo do que está escolhido, sem o formulário na tela', async () => {
    entrarComo('Presidente')
    comApi()
    renderizar(<RecebimentosDaTurma />)

    const cartao = await screen.findByRole('region', { name: 'Recebimentos da turma' })
    expect(await within(cartao).findByText('Conferência manual')).toBeVisible()
    expect(within(cartao).getByText('turma@mp.dev')).toBeVisible()
    expect(within(cartao).getByRole('button', { name: 'Editar' })).toBeVisible()

    expect(screen.queryByLabelText('Chave PIX')).not.toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('o Editar abre o diálogo com o modo e os meios', async () => {
    entrarComo('Presidente')
    comApi()
    renderizar(<RecebimentosDaTurma />)

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))

    const dialogo = await screen.findByRole('alertdialog', { name: 'Recebimentos da turma' })
    expect(within(dialogo).getByRole('radio', { name: 'Conferência manual' })).toBeChecked()
    expect(within(dialogo).getByRole('radio', { name: 'Confirmação automática' })).toBeEnabled()
    expect(within(dialogo).getByLabelText('Chave PIX')).toHaveValue('turma@mp.dev')
    expect(within(dialogo).getByRole('button', { name: 'Salvar' })).toBeVisible()
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toBeVisible()
  })

  it('prepara a confirmação automática sem conta conectada, sem ativar a cobrança', async () => {
    entrarComo('Presidente')
    const pedidos: unknown[] = []
    comApi()
    servidor.use(
      http.put(`${MERCADO_PAGO}/cobranca`, async ({ request }) => {
        pedidos.push(await request.json())
        return HttpResponse.json({ provedor })
      }),
    )
    renderizar(<RecebimentosDaTurma />)

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    const dialogo = await screen.findByRole('alertdialog', { name: 'Recebimentos da turma' })
    const automatica = within(dialogo).getByRole('radio', { name: 'Confirmação automática' })
    expect(automatica).toBeEnabled()

    await userEvent.click(automatica)

    expect(automatica).toBeChecked()
    expect(within(dialogo).getByRole('radio', { name: 'Conferência manual' })).not.toBeChecked()
    expect(pedidos).toEqual([])
    expect(within(dialogo).getByRole('button', { name: 'Salvar' })).toBeDisabled()
    expect(within(dialogo).getByText('Meios manuais de reserva')).toBeVisible()
    expect(within(dialogo).getByLabelText('Chave PIX')).not.toBeVisible()
    expect(within(dialogo).queryByRole('region', { name: 'Loja pública' })).not.toBeInTheDocument()

    await userEvent.click(within(dialogo).getByRole('radio', { name: 'Conferência manual' }))
    expect(within(dialogo).getByLabelText('Chave PIX')).toBeVisible()
    expect(within(dialogo).queryByRole('status')).not.toBeInTheDocument()
    expect(pedidos).toEqual([])
  })

  it('sem PIX, mantém a reserva aberta para permitir o cadastro antes da conexão', async () => {
    entrarComo('Presidente')
    comApi({ meios: null })
    renderizar(<RecebimentosDaTurma />)

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Confirmação automática' }))

    expect(screen.getByText('Meios manuais de reserva').closest('details')).toHaveAttribute('open')
    expect(screen.getByRole('checkbox', { name: /PIX/ })).toBeVisible()
    expect(screen.getByRole('checkbox', { name: /PIX/ })).not.toBeChecked()
    expect(screen.queryByLabelText('Chave PIX')).not.toBeInTheDocument()
  })

  it('fechar a edição pelo link preserva os outros parâmetros e a âncora', async () => {
    entrarComo('Presidente')
    comApi()
    const { router } = renderizar(
      <RecebimentosDaTurma />,
      '/formatura?trocar=meios&origem=teste#recebimentos',
    )
    const dialogo = await screen.findByRole('alertdialog', { name: 'Recebimentos da turma' })
    await userEvent.click(await within(dialogo).findByRole('radio', { name: 'Confirmação automática' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(router.state.location.pathname).toBe('/formatura')
    expect(router.state.location.search).toBe('?origem=teste')
    expect(router.state.location.hash).toBe('#recebimentos')
  })

  it.each(['Presidente', 'Tesoureiro'])(
    '%s ativa a cobrança após confirmar e atualiza o resumo',
    async (papel) => {
      entrarComo(papel)
      comApi({ conexao: provedor })
      const pedidos: unknown[] = []
      servidor.use(
        http.put(`${MERCADO_PAGO}/cobranca`, async ({ request }) => {
          pedidos.push(await request.json())
          return HttpResponse.json({ provedor: automatico })
        }),
      )
      renderizar(<RecebimentosDaTurma />)

      await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
      await userEvent.click(screen.getByRole('radio', { name: 'Confirmação automática' }))
      expect(screen.getByRole('radio', { name: 'Confirmação automática' })).toBeChecked()
      expect(
        screen.queryByRole('alertdialog', { name: 'Usar confirmação automática?' }),
      ).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
      const confirmacao = await screen.findByRole('alertdialog', { name: 'Usar confirmação automática?' })
      expect(pedidos).toEqual([])
      await userEvent.click(within(confirmacao).getByRole('button', { name: 'Trocar' }))

      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
      expect(pedidos).toEqual([{ automatica: true }])
      const cartao = screen.getByRole('region', { name: 'Recebimentos da turma' })
      expect(within(cartao).getByText('Confirmação automática')).toBeVisible()

      await userEvent.click(within(cartao).getByRole('button', { name: 'Editar' }))
      expect(screen.getByRole('radio', { name: 'Confirmação automática' })).toBeChecked()
      expect(screen.getByText('Meios manuais de reserva')).toBeVisible()
      expect(
        within(screen.getByRole('alertdialog', { name: 'Recebimentos da turma' })).getByText('turma@mp.dev'),
      ).toBeVisible()
    },
  )

  it('cancelar a troca mantém o modo manual sem enviar a configuração', async () => {
    entrarComo('Presidente')
    comApi({ conexao: provedor })
    const pedidos: unknown[] = []
    servidor.use(
      http.put(`${MERCADO_PAGO}/cobranca`, async ({ request }) => {
        pedidos.push(await request.json())
        return HttpResponse.json({ provedor: automatico })
      }),
    )
    renderizar(<RecebimentosDaTurma />)

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Confirmação automática' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(screen.getByRole('radio', { name: 'Conferência manual' })).toBeChecked()
    expect(screen.getByLabelText('Chave PIX')).toBeVisible()
    expect(pedidos).toEqual([])
  })

  it.each([
    {
      conexao: provedor,
      modo: 'Confirmação automática',
      codigo: 'recebimento.avisos_pendentes',
      mensagem: 'Há 2 aviso(s) de pagamento esperando conferência.',
    },
    {
      conexao: automatico,
      modo: 'Conferência manual',
      codigo: 'recebimento.pix_em_aberto',
      mensagem: 'Há PIX do Mercado Pago que formandos ainda podem pagar hoje.',
    },
  ])('mostra $codigo no editor e mantém o modo gravado', async ({ conexao, modo, codigo, mensagem }) => {
    entrarComo('Tesoureiro')
    comApi({ conexao })
    servidor.use(
      http.put(`${MERCADO_PAGO}/cobranca`, async () => {
        await delay(100)
        return HttpResponse.json({ status: 409, codigo, detail: mensagem }, { status: 409 })
      }),
    )
    renderizar(<RecebimentosDaTurma />)

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    await userEvent.click(screen.getByRole('radio', { name: modo }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Trocar' }))
    expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: modo })).toBeDisabled()

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem)
    expect(screen.getByRole('radio', { name: modo })).toBeChecked()
    expect(screen.getByRole('radio', { name: modo })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(
      screen.getByText(conexao === provedor ? 'Conferência manual' : 'Confirmação automática'),
    ).toBeVisible()
  })

  it('salvar os meios fecha o diálogo e atualiza o resumo', async () => {
    entrarComo('Presidente')
    const gravados = comApi()
    renderizar(<RecebimentosDaTurma />)

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    const dialogo = await screen.findByRole('alertdialog', { name: 'Recebimentos da turma' })
    await userEvent.clear(within(dialogo).getByLabelText('Chave PIX'))
    await userEvent.type(within(dialogo).getByLabelText('Chave PIX'), 'nova@kapa.dev')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    const confirmacao = await screen.findByRole('alertdialog', {
      name: 'Salvar os meios de recebimento?',
    })
    await userEvent.click(within(confirmacao).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(gravados).toHaveLength(1))
    expect(gravados[0]).toMatchObject({ pix: { chave: 'nova@kapa.dev' } })
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog', { name: 'Recebimentos da turma' })).not.toBeInTheDocument(),
    )
    expect(await screen.findByText('nova@kapa.dev')).toBeVisible()
  })

  it('a recusa do modo não grava os meios editados e preserva o rascunho', async () => {
    entrarComo('Presidente')
    const gravados = comApi({ conexao: provedor })
    servidor.use(
      http.put(`${MERCADO_PAGO}/cobranca`, () =>
        HttpResponse.json(
          {
            status: 409,
            codigo: 'recebimento.avisos_pendentes',
            detail: 'Confira os avisos antes de trocar.',
          },
          { status: 409 },
        ),
      ),
    )
    renderizar(<RecebimentosDaTurma />)

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    await userEvent.clear(screen.getByLabelText('Chave PIX'))
    await userEvent.type(screen.getByLabelText('Chave PIX'), 'nova@kapa.dev')
    await userEvent.click(screen.getByRole('radio', { name: 'Confirmação automática' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Trocar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Confira os avisos antes de trocar.')
    expect(screen.getByLabelText('Chave PIX')).toBeVisible()
    expect(screen.getByLabelText('Chave PIX')).toHaveValue('nova@kapa.dev')
    expect(gravados).toEqual([])
  })

  it('informa quando só o modo foi salvo e permite corrigir os meios sem repetir a troca', async () => {
    entrarComo('Presidente')
    comApi({ conexao: provedor })
    const modos: unknown[] = []
    let tentativas = 0
    servidor.use(
      http.put(`${MERCADO_PAGO}/cobranca`, async ({ request }) => {
        modos.push(await request.json())
        return HttpResponse.json({ provedor: automatico })
      }),
      http.put(CONTA, async ({ request }) => {
        tentativas++
        if (tentativas === 1)
          return HttpResponse.json({ errors: { 'pix.chave': ['Confira a chave PIX.'] } }, { status: 400 })
        return HttpResponse.json({
          conta: { ...conta, meios: await request.json() },
          confirmacao_enviada_para: null,
        })
      }),
    )
    renderizar(<RecebimentosDaTurma />)

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    await userEvent.clear(screen.getByLabelText('Chave PIX'))
    await userEvent.type(screen.getByLabelText('Chave PIX'), 'nova@kapa.dev')
    await userEvent.click(screen.getByRole('radio', { name: 'Confirmação automática' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Trocar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A forma de cobrança foi salva. Os meios não foram salvos',
    )
    expect(screen.getByText('Confira a chave PIX.')).toBeVisible()
    expect(screen.getByLabelText('Chave PIX')).toHaveValue('nova@kapa.dev')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    const confirmacao = await screen.findByRole('alertdialog', { name: 'Salvar os meios de recebimento?' })
    await userEvent.click(within(confirmacao).getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(modos).toEqual([{ automatica: true }])
    expect(tentativas).toBe(2)
  })

  it('não indica a loja como disponível quando o plano não inclui a festa', async () => {
    entrarComo('Presidente')
    comApi({ conexao: provedor })
    renderizar(<RecebimentosDaTurma />, '/formatura', '*', PLANO_GRATUITO)

    expect(await screen.findByText('Indisponível no plano atual')).toBeVisible()
    expect(screen.queryByText('Pode receber pelo Mercado Pago')).not.toBeInTheDocument()
  })

  it('a tesouraria troca o modo, mas os meios ficam com o Presidente', async () => {
    entrarComo('Tesoureiro')
    const pedidos: unknown[] = []
    comApi({ conexao: automatico })
    servidor.use(
      http.put(`${MERCADO_PAGO}/cobranca`, async ({ request }) => {
        pedidos.push(await request.json())
        return HttpResponse.json({ provedor })
      }),
    )
    renderizar(<RecebimentosDaTurma />)

    expect(await screen.findByText('Confirmação automática')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))

    const dialogo = await screen.findByRole('alertdialog', { name: 'Recebimentos da turma' })
    expect(within(dialogo).getByRole('radio', { name: 'Confirmação automática' })).toBeChecked()
    // No automático, o manual vira reserva recolhida — e a Tesouraria não tem o formulário.
    expect(within(dialogo).getByText('Meios manuais de reserva')).toBeVisible()
    expect(within(dialogo).queryByLabelText('Chave PIX')).not.toBeInTheDocument()
    await userEvent.click(within(dialogo).getByText('Meios manuais de reserva'))
    expect(
      within(dialogo).getByText('A chave PIX, a conta e o dinheiro são definidos pelo Presidente da turma.'),
    ).toBeVisible()

    await userEvent.click(within(dialogo).getByRole('radio', { name: 'Conferência manual' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Trocar' }))

    await waitFor(() => expect(pedidos).toEqual([{ automatica: false }]))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.queryByText('Meios manuais de reserva')).not.toBeInTheDocument()
    expect(screen.getByText('Conferência manual')).toBeVisible()
  })

  it('no automático, os meios manuais ficam recolhidos como reserva', async () => {
    entrarComo('Presidente')
    comApi({ conexao: automatico })
    renderizar(<RecebimentosDaTurma />)

    await screen.findByText('Confirmação automática')
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    const dialogo = await screen.findByRole('alertdialog', { name: 'Recebimentos da turma' })

    expect(within(dialogo).getByLabelText('Chave PIX')).not.toBeVisible()

    await userEvent.click(within(dialogo).getByText('Meios manuais de reserva'))

    expect(within(dialogo).getByLabelText('Chave PIX')).toBeVisible()
  })

  it('sem meios, mostra o campo "Meios de pagamento" não preenchido', async () => {
    entrarComo('Tesoureiro')
    comApi({ meios: null })
    renderizar(<RecebimentosDaTurma />)

    const cartao = await screen.findByRole('region', { name: 'Recebimentos da turma' })
    expect(await within(cartao).findByText('Sem meios')).toBeVisible()
    expect(within(cartao).getByText('Meios de pagamento')).toBeVisible()
    expect(within(cartao).getByText('Não preenchido')).toBeVisible()
    expect(within(cartao).queryByRole('img')).not.toBeInTheDocument()

    await userEvent.click(within(cartao).getByRole('button', { name: 'Editar' }))
    const dialogo = await screen.findByRole('alertdialog', { name: 'Recebimentos da turma' })
    expect(within(dialogo).queryByLabelText('Chave PIX')).not.toBeInTheDocument()
    expect(
      within(dialogo).getByText('A chave PIX, a conta e o dinheiro são definidos pelo Presidente da turma.'),
    ).toBeVisible()
  })

  it('o PIX a conferir aparece com o teste de R$ 1,00', async () => {
    entrarComo('Presidente')
    comApi({ meios: semConferir })
    renderizar(<RecebimentosDaTurma />)

    expect(await screen.findByRole('region', { name: 'PIX de teste' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Conferi: o banco mostrou este titular' }))

    expect(await screen.findByText('Chave conferida')).toBeVisible()
    expect(screen.getByText(/Conferida em .* por Helena/)).toBeVisible()
  })

  it('sem PIX não há teste de R$ 1,00', async () => {
    entrarComo('Presidente')
    comApi({
      meios: {
        ...conta,
        meios: {
          pix: null,
          transferencia: null,
          dinheiro: { nome: 'Bruna Tesoureira', onde: 'nas reuniões de quinta' },
        },
      },
    })
    renderizar(<RecebimentosDaTurma />)

    expect(await screen.findByText('Bruna Tesoureira')).toBeVisible()
    expect(screen.queryByRole('region', { name: 'PIX de teste' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Chave (conferida|a conferir)/)).not.toBeInTheDocument()
  })

  it('turma em consulta mostra o resumo sem o Editar', async () => {
    entrarComo('Presidente')
    comApi({ status: 'Suspensa' })
    renderizar(<RecebimentosDaTurma />)

    expect(await screen.findByText('Conferência manual')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('o link ?trocar=meios abre o diálogo direto', async () => {
    entrarComo('Presidente')
    comApi({ conexao: automatico })
    renderizar(<RecebimentosDaTurma />, '/formatura?trocar=meios')

    const dialogo = await screen.findByRole('alertdialog', { name: 'Recebimentos da turma' })
    await waitFor(() =>
      expect(within(dialogo).getByRole('radio', { name: 'Confirmação automática' })).toBeChecked(),
    )
    expect(within(dialogo).getByText('Meios manuais de reserva').closest('details')).toHaveAttribute('open')
    expect(within(dialogo).getByLabelText('Chave PIX')).toBeVisible()
  })

  it('o link de edição não abre um formulário em turma suspensa', async () => {
    entrarComo('Presidente')
    comApi({ status: 'Suspensa' })
    renderizar(<RecebimentosDaTurma />, '/formatura?trocar=meios')

    expect(await screen.findByText('Conferência manual')).toBeVisible()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('sem meio nenhum marcado, o formulário não deixa salvar', async () => {
    entrarComo('Presidente')
    const gravados = comApi()
    renderizar(<RecebimentosDaTurma />)

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    const dialogo = await screen.findByRole('alertdialog', { name: 'Recebimentos da turma' })
    await userEvent.click(within(dialogo).getByRole('checkbox', { name: /PIX/ }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    expect(
      await screen.findByText('Escolha ao menos um meio de recebimento para a turma.'),
    ).toBeInTheDocument()
    expect(gravados).toHaveLength(0)
  })

  it('mostra embaixo do campo o motivo que a API deu para recusar a chave', async () => {
    entrarComo('Presidente')
    comApi()
    servidor.use(
      http.put(CONTA, () =>
        HttpResponse.json(
          { title: 'Chave inválida.', errors: { 'pix.chave': ['Esta chave não está registrada no PIX.'] } },
          { status: 400 },
        ),
      ),
    )
    renderizar(<RecebimentosDaTurma />)

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    const dialogo = await screen.findByRole('alertdialog', { name: 'Recebimentos da turma' })
    await userEvent.clear(within(dialogo).getByLabelText('Chave PIX'))
    await userEvent.type(within(dialogo).getByLabelText('Chave PIX'), 'outra@kapa.dev')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    const confirmacao = await screen.findByRole('alertdialog', {
      name: 'Salvar os meios de recebimento?',
    })
    await userEvent.click(within(confirmacao).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Esta chave não está registrada no PIX.')).toBeVisible()
    expect(screen.getByRole('alertdialog', { name: 'Recebimentos da turma' })).toBeVisible()
  })
})
