import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { ScrollRestoration } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { ContaDeRecebimento } from '../types/recebimentos.types'
import { MeiosDeRecebimento } from './MeiosDeRecebimento'

const CONTA = `${env.VITE_API_URL}/api/v1/recebimentos/conta`
const FORMATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual`

const gravada: ContaDeRecebimento = {
  meios: {
    pix: {
      tipo_de_chave: 'Email',
      chave: 'tesouraria@kapa.dev',
      nome_do_titular: 'Helena Araújo',
      cidade: 'Curitiba',
      banco: null,
    },
    transferencia: null,
    dinheiro: null,
  },
  atualizada_em: '2026-09-10T12:00:00Z',
  conferida_em: null,
  conferida_por: null,
}

const conferida: ContaDeRecebimento = {
  ...gravada,
  conferida_em: '2026-09-11T14:30:00Z',
  conferida_por: 'Helena Araújo',
}

/** A turma que só recebe em dinheiro — a que o P4 de 21/09/2026 passou a permitir. */
const soDinheiro: ContaDeRecebimento = {
  ...gravada,
  meios: {
    pix: null,
    transferencia: null,
    dinheiro: { nome: 'Bruna Tesoureira', onde: 'nas reuniões de quinta' },
  },
}

/**
 * @param conta Ausente: a turma ainda não habilitou meio nenhum.
 * @param aoGravar Resposta do `PUT`; por padrão, a troca pedida — com PIX, a API manda o link ao e-mail e a conta
 *   segue como estava.
 */
function comApi(conta?: ContaDeRecebimento, aoGravar?: () => Response) {
  const gravados: unknown[] = []

  servidor.use(
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
    http.get(CONTA, () => HttpResponse.json({ conta: conta ?? null })),
    http.get(`${CONTA}/pix-de-teste`, () =>
      HttpResponse.json({ copia_e_cola: '00020126BR.GOV.BCB.PIX', valor_em_centavos: 100 }),
    ),
    http.put(CONTA, async ({ request }) => {
      gravados.push(await request.json())
      return aoGravar
        ? aoGravar()
        : HttpResponse.json({ conta: conta ?? null, confirmacao_enviada_para: 'he***@kapa.dev' })
    }),
    http.post(`${CONTA}/conferir`, () => HttpResponse.json(conferida)),
  )

  return gravados
}

describe('MeiosDeRecebimento', () => {
  afterEach(() => {
    sessao.encerrar()
    vi.restoreAllMocks()
  })

  it('editar, cancelar e salvar preservam a rolagem; outra página continua voltando ao topo', async () => {
    entrarComo('Presidente')
    comApi(conferida)
    const rolar = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const estado = { origemDaPagina: { caminho: '/inicio', titulo: 'Início' } }
    const { router } = renderizar(
      <>
        <ScrollRestoration />
        <MeiosDeRecebimento />
      </>,
      { pathname: '/formatura', state: estado },
    )

    await screen.findByRole('button', { name: 'Editar' })
    rolar.mockClear()
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(screen.getByLabelText('Chave PIX')).toBeVisible()
    expect(router.state.location.search).toBe('?trocar=meios')
    expect(router.state.location.state).toEqual(estado)
    expect(rolar).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(await screen.findByRole('button', { name: 'Editar' })).toBeVisible()
    expect(router.state.location.search).toBe('')
    expect(rolar).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Salvar' }),
    )
    expect(await screen.findByRole('button', { name: 'Editar' })).toBeVisible()
    expect(router.state.location.search).toBe('')
    expect(router.state.location.state).toEqual(estado)
    expect(rolar).not.toHaveBeenCalled()

    await router.navigate('/inicio')
    await waitFor(() => expect(rolar).toHaveBeenCalledWith(0, 0))
  })

  /** Revisão de segurança de 05/10/2026: o PIX só vale pelo link do e-mail — antes dele, nada de QR de teste. */
  it('o Presidente cadastra o PIX, e ele espera a confirmação por e-mail antes do teste de R$ 1,00', async () => {
    entrarComo('Presidente')
    const gravados = comApi()

    renderizar(<MeiosDeRecebimento />)

    // Sem meio nenhum, o formulário já abre: não há o que ler antes de cadastrar, e o PIX nasce ligado.
    await userEvent.selectOptions(await screen.findByLabelText('Tipo de chave'), 'Email')
    await userEvent.type(screen.getByLabelText('Chave PIX'), 'tesouraria@kapa.dev')
    await userEvent.type(screen.getByLabelText('Nome do titular'), 'Helena Araújo')
    await userEvent.type(screen.getByLabelText('Cidade do titular'), 'Curitiba')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(gravados).toEqual([
        {
          pix: {
            tipo_de_chave: 'Email',
            chave: 'tesouraria@kapa.dev',
            nome_do_titular: 'Helena Araújo',
            cidade: 'Curitiba',
            banco: null,
          },
          transferencia: null,
          dinheiro: null,
        },
      ]),
    )

    // Pedida, não gravada: a conta continua vazia até o link do e-mail, e não há chave para testar.
    expect(screen.queryByRole('img', { name: /QR/i })).not.toBeInTheDocument()
  })

  /** Decisão 2 da Sprint 18: o meio existe quando o grupo dele está preenchido — não há bool solto. */
  it('ligar dinheiro manda o grupo; desligado ele vai null e o formando não vê a opção', async () => {
    entrarComo('Presidente')
    const gravados = comApi()

    renderizar(<MeiosDeRecebimento />)

    await userEvent.click(await screen.findByRole('checkbox', { name: /Dinheiro/ }))
    await userEvent.type(screen.getByLabelText('Quem recebe'), 'Bruna Tesoureira')
    await userEvent.type(screen.getByLabelText(/Onde encontrar/), 'nas reuniões de quinta')
    await userEvent.type(screen.getByLabelText('Chave PIX'), '529.982.247-25')
    await userEvent.type(screen.getByLabelText('Nome do titular'), 'Helena Araújo')
    await userEvent.type(screen.getByLabelText('Cidade do titular'), 'Curitiba')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(gravados).toHaveLength(1))
    expect(gravados[0]).toMatchObject({
      dinheiro: { nome: 'Bruna Tesoureira', onde: 'nas reuniões de quinta' },
      transferencia: null,
    })
  })

  it('sem meio nenhum marcado, o formulário não deixa salvar', async () => {
    entrarComo('Presidente')
    const gravados = comApi()

    renderizar(<MeiosDeRecebimento />)

    await userEvent.click(await screen.findByRole('checkbox', { name: /PIX/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(
      await screen.findByText('Escolha ao menos um meio de recebimento para a turma.'),
    ).toBeInTheDocument()
    expect(gravados).toHaveLength(0)
  })

  it('confere pelo PIX de teste e mostra quem conferiu e quando', async () => {
    entrarComo('Presidente')
    comApi(gravada)

    renderizar(<MeiosDeRecebimento />)

    await userEvent.click(
      await screen.findByRole('button', { name: 'Conferi: o banco mostrou este titular' }),
    )

    expect(await screen.findByText('Chave conferida')).toBeInTheDocument()
    expect(screen.getByText(/Conferida em .* por Helena Araújo/)).toBeInTheDocument()
  })

  it('alterar os meios diz que vale só pelo link do e-mail, e que a comissão é avisada', async () => {
    entrarComo('Presidente')
    comApi(conferida)

    renderizar(<MeiosDeRecebimento />)

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    await userEvent.clear(screen.getByLabelText('Chave PIX'))
    await userEvent.type(screen.getByLabelText('Chave PIX'), 'nova@kapa.dev')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    const dialogo = await screen.findByRole('alertdialog')
    expect(dialogo).toHaveTextContent('só vale depois que você confirmar pelo link no seu e-mail')
    expect(dialogo).toHaveTextContent('todos da comissão recebem um e-mail')
    expect(within(dialogo).getByRole('button', { name: 'Revisar' })).toBeInTheDocument()
  })

  // A forma da chave o schema já barra sozinho; o que só o servidor sabe — uma chave que o diretório
  // do PIX recusa — precisa voltar para o campo, e não para um toast que some.
  it('mostra embaixo do campo o motivo que a API deu para recusar a chave', async () => {
    entrarComo('Presidente')
    comApi(undefined, () =>
      HttpResponse.json(
        { title: 'Chave inválida.', errors: { 'pix.chave': ['Esta chave não está registrada no PIX.'] } },
        { status: 400 },
      ),
    )

    renderizar(<MeiosDeRecebimento />)

    await userEvent.selectOptions(await screen.findByLabelText('Tipo de chave'), 'Email')
    await userEvent.type(screen.getByLabelText('Chave PIX'), 'tesouraria@kapa.dev')
    await userEvent.type(screen.getByLabelText('Nome do titular'), 'Helena Araújo')
    await userEvent.type(screen.getByLabelText('Cidade do titular'), 'Curitiba')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Esta chave não está registrada no PIX.')).toBeInTheDocument()
  })

  /** P4 de 21/09/2026: sem PIX não há chave para testar, e o cartão do teste não nasce. */
  it('turma que só recebe em dinheiro não tem selo de chave nem PIX de teste', async () => {
    entrarComo('Presidente')
    comApi(soDinheiro)

    renderizar(<MeiosDeRecebimento />)

    expect(await screen.findByText('Bruna Tesoureira')).toBeInTheDocument()
    expect(screen.queryByText(/Chave (conferida|a conferir)/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Conferi/ })).not.toBeInTheDocument()
  })

  it('a tesouraria vê os meios, sem alterar nem conferir', async () => {
    entrarComo('Tesoureiro')
    comApi(gravada)

    renderizar(<MeiosDeRecebimento />)

    expect(await screen.findByText('tesouraria@kapa.dev')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Conferi/ })).not.toBeInTheDocument()
  })

  it('sem meios, a tesouraria lê que quem escolhe é o Presidente', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<MeiosDeRecebimento />)

    expect(await screen.findByText('Sem meios')).toBeInTheDocument()
    expect(screen.getByText(/O presidente precisa escolher como a turma vai receber/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Chave PIX')).not.toBeInTheDocument()
  })
})
