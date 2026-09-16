import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { ContaDeRecebimento } from '../types/recebimentos.types'
import { ChaveDeRecebimento } from './ChaveDeRecebimento'

const CONTA = `${env.VITE_API_URL}/api/v1/recebimentos/conta`
const FORMATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual`

const gravada: ContaDeRecebimento = {
  tipo_de_chave: 'Email',
  chave: 'tesouraria@kapa.dev',
  nome_do_titular: 'Helena Araújo',
  cidade: 'Curitiba',
  atualizada_em: '2026-09-10T12:00:00Z',
}

const conferida: ContaDeRecebimento = {
  ...gravada,
  conferida_em: '2026-09-11T14:30:00Z',
  conferida_por: 'Helena Araújo',
}

/**
 * @param conta Ausente: a turma ainda não cadastrou a chave.
 * @param aoGravar Resposta do `PUT`; por padrão devolve a conta enviada, como a API faz.
 */
function comApi(conta?: ContaDeRecebimento, aoGravar?: () => Response) {
  const gravados: unknown[] = []

  servidor.use(
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
    http.get(CONTA, () => HttpResponse.json({ conta })),
    http.get(`${CONTA}/pix-de-teste`, () =>
      HttpResponse.json({ copia_e_cola: '00020126BR.GOV.BCB.PIX', valor_em_centavos: 100 }),
    ),
    http.put(CONTA, async ({ request }) => {
      gravados.push(await request.json())
      return aoGravar ? aoGravar() : HttpResponse.json(gravada)
    }),
    http.post(`${CONTA}/conferir`, () => HttpResponse.json(conferida)),
  )

  return gravados
}

describe('ChaveDeRecebimento', () => {
  afterEach(() => sessao.encerrar())

  it('o Presidente cadastra a primeira chave e recebe o PIX de teste, desenhado aqui mesmo', async () => {
    entrarComo('Presidente')
    const gravados = comApi()

    renderizar(<ChaveDeRecebimento />)

    // Sem chave, o formulário já abre: não há o que ler antes de cadastrar. O tipo nasce em CPF.
    await userEvent.selectOptions(await screen.findByLabelText('Tipo de chave'), 'Email')
    await userEvent.type(screen.getByLabelText('Chave PIX'), 'tesouraria@kapa.dev')
    await userEvent.type(screen.getByLabelText('Nome do titular'), 'Helena Araújo')
    await userEvent.type(screen.getByLabelText('Cidade do titular'), 'Curitiba')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar chave' }))

    await waitFor(() =>
      expect(gravados).toEqual([
        {
          tipo_de_chave: 'Email',
          chave: 'tesouraria@kapa.dev',
          nome_do_titular: 'Helena Araújo',
          cidade: 'Curitiba',
        },
      ]),
    )

    // Gravada e ainda não conferida: o QR de R$ 1,00 aparece para o Presidente testar.
    expect(await screen.findByRole('img', { name: /QR/i })).toBeInTheDocument()
  })

  it('confere pelo PIX de teste e mostra quem conferiu e quando', async () => {
    entrarComo('Presidente')
    comApi(gravada)

    renderizar(<ChaveDeRecebimento />)

    await userEvent.click(
      await screen.findByRole('button', { name: 'Conferi: o banco mostrou este titular' }),
    )

    expect(await screen.findByText('Conferida')).toBeInTheDocument()
    expect(screen.getByText(/Conferida em .* por Helena Araújo/)).toBeInTheDocument()
  })

  it('trocar a chave diz que a comissão recebe e-mail antes de gravar', async () => {
    entrarComo('Presidente')
    comApi(conferida)

    renderizar(<ChaveDeRecebimento />)

    await userEvent.click(await screen.findByRole('button', { name: 'Trocar chave' }))
    await userEvent.clear(screen.getByLabelText('Chave PIX'))
    await userEvent.type(screen.getByLabelText('Chave PIX'), 'nova@kapa.dev')
    await userEvent.click(screen.getByRole('button', { name: 'Trocar chave' }))

    const dialogo = await screen.findByRole('alertdialog')
    expect(dialogo).toHaveTextContent('Todos da comissão recebem um e-mail')
    expect(dialogo).toHaveTextContent('volta a ficar a conferir')
    expect(within(dialogo).getByRole('button', { name: 'Revisar' })).toBeInTheDocument()
  })

  // A forma da chave o schema já barra sozinho; o que só o servidor sabe — uma chave que o diretório
  // do PIX recusa — precisa voltar para o campo, e não para um toast que some.
  it('mostra embaixo do campo o motivo que a API deu para recusar a chave', async () => {
    entrarComo('Presidente')
    comApi(undefined, () =>
      HttpResponse.json(
        { title: 'Chave inválida.', errors: { Chave: ['Esta chave não está registrada no PIX.'] } },
        { status: 400 },
      ),
    )

    renderizar(<ChaveDeRecebimento />)

    await userEvent.selectOptions(await screen.findByLabelText('Tipo de chave'), 'Email')
    await userEvent.type(screen.getByLabelText('Chave PIX'), 'tesouraria@kapa.dev')
    await userEvent.type(screen.getByLabelText('Nome do titular'), 'Helena Araújo')
    await userEvent.type(screen.getByLabelText('Cidade do titular'), 'Curitiba')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar chave' }))

    expect(await screen.findByText('Esta chave não está registrada no PIX.')).toBeInTheDocument()
  })

  it('a tesouraria vê a chave, sem trocar nem conferir', async () => {
    entrarComo('Tesoureiro')
    comApi(gravada)

    renderizar(<ChaveDeRecebimento />)

    expect(await screen.findByText('tesouraria@kapa.dev')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Trocar chave' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Conferi/ })).not.toBeInTheDocument()
  })

  it('sem chave, a tesouraria lê que quem cadastra é o Presidente', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<ChaveDeRecebimento />)

    expect(await screen.findByText('Sem chave')).toBeInTheDocument()
    expect(screen.getByText(/Quem cadastra a chave é o Presidente/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Chave PIX')).not.toBeInTheDocument()
  })
})
