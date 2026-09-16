import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { formatarCentavos } from '@/lib/formato'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import { pagaDeTeste, parcelaDeTeste, vencidaDeTeste } from '../dadosDeTeste'
import { AcoesDaParcela } from './AcoesDaParcela'

const API = env.VITE_API_URL

function responder() {
  const pedidos = { baixas: [] as FormData[], estornos: [] as unknown[] }
  servidor.use(
    http.get(`${API}/api/v1/formaturas/atual`, () => HttpResponse.json({ id: 'f-1', status: 'Ativa' })),
    http.post(`${API}/api/v1/parcelas/:id/baixa-manual`, async ({ request }) => {
      pedidos.baixas.push(await request.formData())
      return HttpResponse.json(pagaDeTeste())
    }),
    http.post(`${API}/api/v1/parcelas/:id/estornar-baixa`, async ({ request }) => {
      pedidos.estornos.push(await request.json())
      return HttpResponse.json(parcelaDeTeste())
    }),
  )
  return pedidos
}

describe('AcoesDaParcela', () => {
  afterEach(() => sessao.encerrar())

  it('a tesouraria baixa a aberta; a avisada vai para a conferência; a paga não tem ação', () => {
    responder()
    entrarComo('Tesoureiro')

    const { unmount } = renderizar(<AcoesDaParcela parcela={parcelaDeTeste()} />)
    expect(screen.getByRole('button', { name: 'Baixar' })).toBeInTheDocument()
    unmount()

    const avisada = renderizar(<AcoesDaParcela parcela={parcelaDeTeste({ em_conferencia: true })} />)
    expect(screen.getByRole('link', { name: 'Conferir' })).toHaveAttribute('href', '/financeiro/conferencia')
    avisada.unmount()

    renderizar(<AcoesDaParcela parcela={pagaDeTeste()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('a comissão, que só consulta, não vê ação nenhuma', () => {
    responder()
    entrarComo('Comissao')

    renderizar(<AcoesDaParcela parcela={parcelaDeTeste()} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('a baixa manual vem com o valor de hoje e manda forma, dia e valor', async () => {
    const pedidos = responder()
    entrarComo('Tesoureiro')

    renderizar(<AcoesDaParcela parcela={vencidaDeTeste()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Baixar' }))
    const dialogo = await screen.findByRole('alertdialog')
    expect(dialogo).toHaveTextContent('Esta ação fica registrada em seu nome.')
    expect(within(dialogo).getByLabelText('Valor recebido')).toHaveValue(formatarCentavos(36_120))
    await userEvent.selectOptions(within(dialogo).getByLabelText('Como o dinheiro chegou'), 'Dinheiro')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(pedidos.baixas).toHaveLength(1))
    expect(pedidos.baixas[0]?.get('forma')).toBe('Dinheiro')
    expect(pedidos.baixas[0]?.get('valor_em_centavos')).toBe('36120')
  })

  it('o estorno é do Presidente, e pede justificativa', async () => {
    const pedidos = responder()
    entrarComo('Presidente')

    renderizar(<AcoesDaParcela parcela={pagaDeTeste()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Estornar' }))
    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Estornar baixa' }))
    expect(
      await within(dialogo).findByText('Explique por que a baixa está sendo desfeita.'),
    ).toBeInTheDocument()

    await userEvent.type(within(dialogo).getByLabelText('Justificativa'), 'Baixa na parcela errada.')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Estornar baixa' }))

    await waitFor(() => expect(pedidos.estornos).toEqual([{ justificativa: 'Baixa na parcela errada.' }]))
  })
})
