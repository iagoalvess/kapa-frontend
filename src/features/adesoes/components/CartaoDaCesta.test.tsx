import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import type { MinhaCesta, PreviaDoAditivo } from '../types/adesoes.types'
import { CartaoDaCesta } from './CartaoDaCesta'

const BASE = `${env.VITE_API_URL}/api/v1/adesoes`
const SOLICITACOES = `${env.VITE_API_URL}/api/v1/cobrancas/solicitacoes-de-cancelamento`

const festa15 = {
  item_de_cobranca_id: 'f15',
  tipo: 'Festa',
  descricao: 'Festa 15',
  grupo: 'Festa',
  contratado_em_centavos: 300_000,
  convites_da_festa: 15,
  convites_da_colacao: 0,
  observacao: null,
  cancelavel_ate: null,
  cancelamento_solicitado: false,
} as const

/** O exemplo da sprint: Ana tem a Festa 15 e pode subir para a 20 pagando R$ 600. */
const cesta: MinhaCesta = {
  pacotes: [
    festa15,
    {
      ...festa15,
      item_de_cobranca_id: 'fotos',
      tipo: 'FotoEAlbum',
      descricao: 'Fotos',
      grupo: null,
      contratado_em_centavos: 60_000,
      convites_da_festa: 0,
      cancelavel_ate: '2020-01-01',
    },
  ],
  disponiveis: [
    {
      item_de_cobranca_id: 'f20',
      tipo: 'Festa',
      descricao: 'Festa 20',
      grupo: 'Festa',
      valor_em_centavos: 360_000,
      diferenca_em_centavos: 60_000,
      convites_da_festa: 20,
      convites_da_colacao: 0,
      substitui: 'f15',
    },
  ],
}

const previa: PreviaDoAditivo = {
  mudancas: [
    {
      entra: {
        item_id: 'f20',
        grupo: 'Festa',
        tipo: 'Festa',
        descricao: 'Festa 20',
        valor_em_centavos: 360_000,
        convites_da_festa: 20,
        convites_da_colacao: 0,
      },
      sai: {
        item_id: 'f15',
        grupo: 'Festa',
        tipo: 'Festa',
        descricao: 'Festa 15',
        valor_em_centavos: 300_000,
        convites_da_festa: 15,
        convites_da_colacao: 0,
      },
      ja_contratado_em_centavos: 300_000,
      diferenca_em_centavos: 60_000,
    },
  ],
  parcelas: [
    {
      tipo: 'Festa',
      descricao: 'Festa 20',
      numero: 1,
      de: 1,
      vencimento: '2026-11-10',
      valor_em_centavos: 60_000,
    },
  ],
  total_em_centavos: 60_000,
  hash_do_conteudo: 'a'.repeat(64),
}

describe('CartaoDaCesta', () => {
  /** D38: o aditivo tem o rito da adesão — prévia com hash, código no e-mail, e os três vão no aceite. */
  it('acrescenta pela prévia e pelo código, e envia hash, código e o detalhe', async () => {
    let aceito: unknown
    servidor.use(
      http.get(`${BASE}/minha-cesta`, () => HttpResponse.json(cesta)),
      http.post(`${BASE}/aditivo/previa`, () => HttpResponse.json(previa)),
      http.post(`${BASE}/aditivo/codigo`, () =>
        HttpResponse.json({ email: 'an*@kapa.dev', valido_por_minutos: 3 }),
      ),
      http.post(`${BASE}/aditivo`, async ({ request }) => {
        aceito = await request.json()
        return HttpResponse.json(previa)
      }),
    )
    renderizar(<CartaoDaCesta cestaAceita={null} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Acrescentar' }))
    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialogo).getByRole('checkbox', { name: /Festa 20/ }))
    await userEvent.type(within(dialogo).getByLabelText('Detalhe de Festa — Festa 20'), 'mesa perto da pista')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Ver o aditivo' }))

    expect(await within(dialogo).findByText(/no lugar de Festa — Festa 15/)).toBeInTheDocument()
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Enviar código' }))
    await userEvent.type(await within(dialogo).findByLabelText(/Código enviado para/), '123456')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Aceitar aditivo' }))

    await expect
      .poll(() => aceito)
      .toEqual({
        pacotes: ['f20'],
        hash_do_conteudo: 'a'.repeat(64),
        codigo: '123456',
        observacoes: [{ pacote_id: 'f20', texto: 'mesa perto da pista' }],
      })
  })

  /** D8/D36: tirar é pedir à comissão, e só até o "cancelável até" — as Fotos, vencidas, não oferecem o botão. */
  it('pede o cancelamento só do pacote ainda cancelável', async () => {
    let pedido: unknown
    servidor.use(
      http.get(`${BASE}/minha-cesta`, () => HttpResponse.json(cesta)),
      http.post(SOLICITACOES, async ({ request }) => {
        pedido = await request.json()
        return HttpResponse.json({})
      }),
    )
    renderizar(<CartaoDaCesta cestaAceita={null} />)

    expect(await screen.findByText('Festa — Festa 15')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /Ações de Fotos/ })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Pedir cancelamento' }))
    await userEvent.type(await screen.findByLabelText('Motivo (opcional)'), 'não vou mais')
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Pedir cancelamento' }),
    )

    await expect.poll(() => pedido).toEqual({ item_de_cobranca_id: 'f15', motivo: 'não vou mais' })
  })
})
