import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, pagina, renderizar } from '@/test/utils'
import HistoricoDeAvisosPage from './HistoricoDeAvisosPage'

const HISTORICO = `${env.VITE_API_URL}/api/v1/notificacoes/historico`

describe('HistoricoDeAvisosPage', () => {
  afterEach(() => sessao.encerrar())

  it('devolve a comissão para Parcelas, que ela pode abrir', async () => {
    entrarComo('Comissao')
    servidor.use(http.get(HISTORICO, () => HttpResponse.json(pagina([]))))

    renderizar(<HistoricoDeAvisosPage />)

    expect(screen.getByRole('link', { name: 'Parcelas' })).toHaveAttribute('href', '/cobrancas/parcelas')
    expect(await screen.findByText('Nenhum aviso enviado ainda')).toBeInTheDocument()
  })

  it('devolve a tesouraria para Parcelas quando o histórico foi aberto por lá, mesmo após filtrar', async () => {
    entrarComo('Tesoureiro')
    servidor.use(http.get(HISTORICO, () => HttpResponse.json(pagina([]))))

    renderizar(<HistoricoDeAvisosPage />, '/notificacoes/enviados?origem=parcelas')

    expect(screen.getByRole('link', { name: 'Parcelas' })).toHaveAttribute('href', '/cobrancas/parcelas')
    expect(screen.queryByRole('link', { name: 'Lembretes automáticos' })).not.toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Buscar destinatário'), 'Ana{enter}')

    expect(screen.getByRole('link', { name: 'Parcelas' })).toHaveAttribute('href', '/cobrancas/parcelas')
    expect(await screen.findByText('Nenhum aviso enviado ainda')).toBeInTheDocument()
  })

  it('devolve a tesouraria para Lembretes quando não veio de Parcelas', async () => {
    entrarComo('Tesoureiro')
    servidor.use(http.get(HISTORICO, () => HttpResponse.json(pagina([]))))

    renderizar(<HistoricoDeAvisosPage />)

    expect(screen.getByRole('link', { name: 'Lembretes automáticos' })).toHaveAttribute(
      'href',
      '/notificacoes/lembretes',
    )
    expect(await screen.findByText('Nenhum aviso enviado ainda')).toBeInTheDocument()
  })
})
