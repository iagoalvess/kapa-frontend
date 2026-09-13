import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import PlanosPage from './PlanosPage'

const PLANOS = [
  {
    id: 'p-1',
    codigo: 'essencial',
    nome: 'Essencial',
    precoEmCentavos: 14990,
    ciclo: 'Mensal',
    limiteDeFormandos: 60,
    recomendado: false,
  },
  {
    id: 'p-2',
    codigo: 'completo',
    nome: 'Completo',
    precoEmCentavos: 34990,
    ciclo: 'Mensal',
    limiteDeFormandos: 150,
    recomendado: true,
  },
]

function entrarComo(papel: string) {
  const corpo = { sub: 'u-1', name: 'Ana', formatura_id: 'f-1', papel }
  sessao.autenticar({
    accessToken: `c.${btoa(JSON.stringify(corpo))}.a`,
    expiraEm: new Date(Date.now() + 900_000).toISOString(),
  })
}

function comFormatura(status: string) {
  servidor.use(
    http.get(`${env.VITE_API_URL}/api/v1/planos`, () => HttpResponse.json(PLANOS)),
    http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () => HttpResponse.json({ id: 'f-1', status })),
  )
}

describe('PlanosPage', () => {
  afterEach(() => {
    sessao.encerrar()
    globalThis.location.hash = ''
  })

  /** A URL devolvida é só um âncora aqui: o jsdom navega por hash, e é assim que dá para ver a ida ao provedor. */
  it('o Presidente contrata e vai para a página do provedor', async () => {
    entrarComo(PAPEIS.presidente)
    comFormatura('Rascunho')
    let pedido: unknown
    servidor.use(
      http.post(`${env.VITE_API_URL}/api/v1/formaturas/atual/assinatura/checkout`, async ({ request }) => {
        pedido = await request.json()
        return HttpResponse.json({ url: '#provedor' })
      }),
    )
    const usuario = userEvent.setup()

    renderizar(<PlanosPage />)
    expect(await screen.findByText(/R\$\s?349,90/)).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Contratar Completo' }))

    await expect.poll(() => globalThis.location.hash).toBe('#provedor')
    expect(pedido).toEqual({ planoCodigo: 'completo' })
  })

  it('quem não é Presidente vê os planos sem poder contratar', async () => {
    entrarComo(PAPEIS.tesoureiro)
    comFormatura('Rascunho')

    renderizar(<PlanosPage />)

    expect(await screen.findByRole('button', { name: 'Contratar Completo' })).toBeDisabled()
    expect(screen.getByText(/Só o Presidente/)).toBeInTheDocument()
  })

  it('turma ativa não contrata de novo', async () => {
    entrarComo(PAPEIS.presidente)
    comFormatura('Ativa')

    renderizar(<PlanosPage />)

    expect(await screen.findByText(/já tem uma assinatura ativa/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Contratar Completo' })).toBeDisabled()
  })
})
