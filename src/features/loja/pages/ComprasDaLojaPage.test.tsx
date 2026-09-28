import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, pagina, renderizar } from '@/test/utils'
import type { CompraNaGestao, ResumoDaLoja } from '../types/loja.types'
import ComprasDaLojaPage from './ComprasDaLojaPage'

const COMPRAS = `${env.VITE_API_URL}/api/v1/loja/compras`

const resumo: ResumoDaLoja = {
  convites_vendidos: 42,
  aguardando_pix: 3,
  compras_a_devolver: 1,
  arrecadado_em_centavos: 1_050_000,
}

const compra = (dados: Partial<CompraNaGestao> = {}): CompraNaGestao => ({
  id: 'c-1',
  criada_em: '2026-09-24T15:00:00Z',
  nome: 'Maria Souza',
  email: 'maria@teste.dev',
  cpf: '***.982.247-**',
  item: 'Convite adulto',
  quantidade: 2,
  valor_em_centavos: 50_000,
  meio: 'Pix',
  status: 'Paga',
  expira_em: '2026-09-24T15:31:00Z',
  paga_em: '2026-09-24T15:05:00Z',
  valor_pago_em_centavos: 50_000,
  pagador_diferente: false,
  ...dados,
})

describe('ComprasDaLojaPage', () => {
  afterEach(() => sessao.encerrar())

  it('mostra a conta da loja e marca o que é para devolver e o pagador diferente', async () => {
    entrarComo(PAPEIS.presidente)
    servidor.use(
      http.get(`${COMPRAS}/resumo`, () => HttpResponse.json(resumo)),
      http.get(COMPRAS, () =>
        HttpResponse.json(
          pagina([
            compra(),
            compra({ id: 'c-2', nome: 'João Lima', status: 'ADevolver', pagador_diferente: true }),
          ]),
        ),
      ),
    )

    renderizar(<ComprasDaLojaPage />)

    expect(await screen.findByText('João Lima')).toBeInTheDocument()
    expect(screen.getByText('A devolver', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Pagou outro CPF')).toBeInTheDocument()
    expect(screen.getAllByText('maria@teste.dev')).toHaveLength(2)
    expect(await screen.findByText('Aguardando PIX')).toBeInTheDocument()
  })

  it('o filtro de situação vai para a API', async () => {
    entrarComo(PAPEIS.presidente)
    const pedidos: string[] = []
    servidor.use(
      http.get(`${COMPRAS}/resumo`, () => HttpResponse.json(resumo)),
      http.get(COMPRAS, ({ request }) => {
        pedidos.push(new URL(request.url).searchParams.get('status') ?? '')
        return HttpResponse.json(pagina([compra()]))
      }),
    )
    const usuario = userEvent.setup()
    renderizar(<ComprasDaLojaPage />)

    await screen.findByText('Maria Souza')
    await usuario.selectOptions(screen.getByLabelText('Situação'), 'ADevolver')

    await waitFor(() => expect(pedidos).toContain('ADevolver'))
  })
})
