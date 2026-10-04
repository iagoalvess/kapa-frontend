import { screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { pagina, renderizar } from '@/test/utils'
import PaginaDeParcelas from './PaginaDeParcelas'

const PARCELAS = `${env.VITE_API_URL}/api/v1/cobrancas/parcelas`
const vazio = { quantidade: 0, valor_em_centavos: 0 }

describe('PaginaDeParcelas', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('oferece as parcelas pessoais no topo da lista da turma', async () => {
    servidor.use(
      http.get(`${PARCELAS}/resumo`, () =>
        HttpResponse.json({
          todas: vazio,
          aberta: vazio,
          vencida: vazio,
          paga: vazio,
          cancelada: vazio,
          vencido_atualizado_em_centavos: 0,
        }),
      ),
      http.get(PARCELAS, () => HttpResponse.json(pagina([]))),
    )

    renderizar(<PaginaDeParcelas />)

    expect(await screen.findByText('Nenhuma parcela ainda')).toBeInTheDocument()
    // A lateral só aparece depois do carregamento, junto com a lista.
    expect(screen.getByRole('link', { name: 'Ver minhas parcelas' })).toHaveAttribute(
      'href',
      '/minhas-parcelas',
    )
    expect(screen.getByRole('link', { name: 'Avisos enviados' })).toHaveAttribute(
      'href',
      '/notificacoes/enviados?origem=parcelas',
    )
  })

  it('no celular reúne as parcelas pessoais e o histórico de avisos na mesma faixa', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    servidor.use(
      http.get(`${PARCELAS}/resumo`, () =>
        HttpResponse.json({
          todas: vazio,
          aberta: vazio,
          vencida: vazio,
          paga: vazio,
          cancelada: vazio,
          vencido_atualizado_em_centavos: 0,
        }),
      ),
      http.get(PARCELAS, () => HttpResponse.json(pagina([]))),
    )

    renderizar(<PaginaDeParcelas />)
    expect(await screen.findByText('Nenhuma parcela ainda')).toBeInTheDocument()
    const atalhos = screen.getByRole('navigation', { name: 'Mais nesta área' })
    expect(within(atalhos).getByRole('link', { name: 'Minhas parcelas' })).toHaveAttribute(
      'href',
      '/minhas-parcelas',
    )
    expect(within(atalhos).getByRole('link', { name: 'Avisos enviados' })).toHaveAttribute(
      'href',
      '/notificacoes/enviados?origem=parcelas',
    )
    expect(screen.getAllByRole('link', { name: 'Avisos enviados' })).toHaveLength(1)
  })
})
