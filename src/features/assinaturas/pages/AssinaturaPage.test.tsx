import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import AssinaturaPage from './AssinaturaPage'

const ASSINATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual/assinatura`

const ativa = {
  id: 'a-1',
  status: 'Ativa',
  plano: {
    id: 'p-1',
    codigo: 'completo',
    nome: 'Completo',
    precoEmCentavos: 34990,
    ciclo: 'Mensal',
    limiteDeFormandos: 150,
    recomendado: true,
  },
  vigenteAte: '2026-10-12T15:00:00Z',
  proximaCobrancaEm: '2026-10-12T15:00:00Z',
  criadoEm: '2026-09-12T15:00:00Z',
}

function entrarComo(papel: string) {
  const corpo = { sub: 'u-1', name: 'Ana', formatura_id: 'f-1', papel }
  sessao.autenticar({
    accessToken: `c.${btoa(JSON.stringify(corpo))}.a`,
    expiraEm: new Date(Date.now() + 900_000).toISOString(),
  })
}

describe('AssinaturaPage', () => {
  afterEach(() => sessao.encerrar())

  it('mostra plano, valor em reais e vigência', async () => {
    entrarComo(PAPEIS.tesoureiro)
    servidor.use(http.get(ASSINATURA, () => HttpResponse.json(ativa)))

    renderizar(<AssinaturaPage />)

    expect(await screen.findByText('Plano Completo')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s?349,90/)).toBeInTheDocument()
    expect(screen.getAllByText('12/10/2026')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Cancelar renovação' })).not.toBeInTheDocument()
  })

  /**
   * A primeira etapa diz até quando o acesso continua e o que acontece depois; só a segunda cancela.
   * Nenhuma chamada sai antes da confirmação final.
   */
  it('cancela em duas etapas, dizendo até quando o acesso continua', async () => {
    entrarComo(PAPEIS.presidente)
    let cancelamentos = 0
    servidor.use(
      http.get(ASSINATURA, () => HttpResponse.json(ativa)),
      http.post(`${ASSINATURA}/cancelar`, () => {
        cancelamentos++
        return HttpResponse.json({ ...ativa, status: 'Cancelada', proximaCobrancaEm: undefined })
      }),
    )
    const usuario = userEvent.setup()

    renderizar(<AssinaturaPage />)
    await usuario.click(await screen.findByRole('button', { name: 'Cancelar renovação' }))

    const primeira = screen.getByRole('alertdialog')
    expect(within(primeira).getByText(/continua até 12\/10\/2026/)).toBeInTheDocument()
    expect(within(primeira).getByText(/modo leitura/)).toBeInTheDocument()
    expect(within(primeira).getByText(/nada é apagado/)).toBeInTheDocument()

    await usuario.click(within(primeira).getByRole('button', { name: 'Entendi, continuar' }))
    expect(cancelamentos).toBe(0)

    await usuario.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar renovação' }),
    )

    await expect.poll(() => cancelamentos).toBe(1)
  })

  it('sem assinatura, o Presidente é levado aos planos', async () => {
    entrarComo(PAPEIS.presidente)
    servidor.use(
      http.get(ASSINATURA, () =>
        HttpResponse.json({ status: 404, codigo: 'assinatura.nao_encontrada' }, { status: 404 }),
      ),
    )

    renderizar(<AssinaturaPage />)

    expect(await screen.findByText('Nenhum plano contratado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver planos' })).toBeInTheDocument()
  })
})
