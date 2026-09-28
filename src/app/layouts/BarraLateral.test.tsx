import { screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import { BarraLateral } from './BarraLateral'

const API = `${env.VITE_API_URL}/api/v1`

function comApi() {
  servidor.use(
    http.get(`${API}/formaturas/atual`, () =>
      HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Suspensa' }),
    ),
    http.get(`${API}/adesoes/eu`, () => HttpResponse.json({ adesao: null })),
    http.get(`${API}/extrato/eu/pendencias`, () => HttpResponse.json({ vencidas_sem_aviso: 2 })),
    http.get(`${API}/formaturas/atual/assinatura`, () => HttpResponse.json({ plano: null })),
  )
}

describe('BarraLateral', () => {
  afterEach(() => sessao.encerrar())

  it('leva a comissão às listas da turma com um item de cada', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<BarraLateral />)

    const menu = within(screen.getByRole('navigation', { name: 'Principal' }))
    expect(menu.getAllByRole('link', { name: /^Parcelas/ })).toHaveLength(1)
    expect(menu.getByRole('link', { name: /^Parcelas/ })).toHaveAttribute('href', '/cobrancas/parcelas')
    expect(menu.getAllByRole('link', { name: 'Pedidos' })).toHaveLength(1)
    expect(menu.getByRole('link', { name: 'Pedidos' })).toHaveAttribute('href', '/cobrancas/pedidos')
  })

  it('leva o formando às listas pessoais com os mesmos nomes', async () => {
    entrarComo('Formando')
    comApi()

    renderizar(<BarraLateral />)

    const menu = within(screen.getByRole('navigation', { name: 'Principal' }))
    expect(menu.getAllByRole('link', { name: /^Parcelas/ })).toHaveLength(1)
    expect(menu.getByRole('link', { name: /^Parcelas/ })).toHaveAttribute('href', '/minhas-parcelas')
    expect(menu.getAllByRole('link', { name: 'Pedidos' })).toHaveLength(1)
    expect(menu.getByRole('link', { name: 'Pedidos' })).toHaveAttribute('href', '/meus-pedidos')
  })

  it('deixa os lembretes dentro do Plano para a tesouraria', () => {
    entrarComo('Tesoureiro')
    comApi()
    servidor.use(
      http.get(`${API}/informes`, () => HttpResponse.json({ itens: [], total: 0 })),
      http.get(`${API}/financeiro/despesas/resumo`, () => HttpResponse.json({ atrasada: { quantidade: 0 } })),
    )

    renderizar(<BarraLateral />)

    const menu = within(screen.getByRole('navigation', { name: 'Principal' }))
    expect(menu.getByRole('link', { name: 'Plano' })).toHaveAttribute('href', '/cobrancas')
    expect(menu.queryByRole('link', { name: 'Lembretes' })).not.toBeInTheDocument()
  })
})
