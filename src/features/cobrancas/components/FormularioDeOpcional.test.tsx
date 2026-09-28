import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import type { DadosDoOpcional } from '../types/cobrancas.types'
import { FormularioDeOpcional } from './FormularioDeOpcional'

const API = env.VITE_API_URL

describe('FormularioDeOpcional', () => {
  /**
   * Sprint 26: a loja é uma porta do mesmo item — o modo, o preço na loja e a abertura com hora, que
   * vai à API em UTC (P4, P8, P10).
   */
  it('abre o convite na loja com preço próprio e a abertura em UTC', async () => {
    let corpo: DadosDoOpcional | null = null
    servidor.use(
      http.get(`${API}/api/v1/festa/itens`, () => HttpResponse.json([])),
      http.post(`${API}/api/v1/cobrancas/opcionais`, async ({ request }) => {
        corpo = (await request.json()) as DadosDoOpcional
        return HttpResponse.json({})
      }),
    )
    const usuario = userEvent.setup()
    renderizar(<FormularioDeOpcional editavel aoConcluir={() => {}} />)

    await usuario.selectOptions(screen.getByLabelText('Onde se vende'), 'Publica')
    expect(screen.getByLabelText('Limite por pessoa (CPF)')).toBeInTheDocument()
    await usuario.type(screen.getByLabelText('Preço de cada unidade'), '18000')
    await usuario.type(screen.getByLabelText('Preço na loja'), '25000')
    await usuario.type(screen.getByLabelText('Vendas abrem em'), '2026-10-01T20:00')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(corpo).not.toBeNull())
    expect(corpo).toMatchObject({
      modo_de_venda: 'Publica',
      valor_em_centavos: 18_000,
      preco_publico_em_centavos: 25_000,
      abertura_de_vendas: new Date(2026, 9, 1, 20, 0).toISOString(),
    })
  })

  it('só o convite da festa vai para a loja', async () => {
    servidor.use(http.get(`${API}/api/v1/festa/itens`, () => HttpResponse.json([])))
    const usuario = userEvent.setup()
    renderizar(<FormularioDeOpcional editavel aoConcluir={() => {}} />)

    await usuario.selectOptions(screen.getByLabelText('Tipo'), 'Kit')
    await usuario.selectOptions(screen.getByLabelText('Onde se vende'), 'Publica')
    await usuario.type(screen.getByLabelText('Preço de cada unidade'), '5000')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('A loja pública vende só o convite da festa.')).toBeInTheDocument()
  })
})
