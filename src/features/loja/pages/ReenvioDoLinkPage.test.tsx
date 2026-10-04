import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import type { Loja } from '../types/loja.types'
import ReenvioDoLinkPage from './ReenvioDoLinkPage'

const LOJA = `${env.VITE_API_URL}/api/v1/loja/f-1`

const loja = (dados: Partial<Loja> = {}): Loja => ({
  turma: 'Medicina 2027',
  instituicao: 'UFPR',
  festa: null,
  contato_da_comissao: 'presidencia@med27.dev',
  meios: ['Pix'],
  agora: new Date().toISOString(),
  itens: [],
  ...dados,
})

function abrir() {
  return renderizar(<ReenvioDoLinkPage />, '/loja/f-1/reenviar', '/loja/:formaturaId/reenviar')
}

describe('ReenvioDoLinkPage', () => {
  it('situa a turma e reenvia o link pelo e-mail', async () => {
    const corpos: { email: string }[] = []
    servidor.use(
      http.get(LOJA, () => HttpResponse.json(loja())),
      http.post(`${LOJA}/reenvio`, async ({ request }) => {
        corpos.push((await request.json()) as { email: string })
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const usuario = userEvent.setup()
    abrir()

    expect(await screen.findByText('Medicina 2027 · UFPR')).toBeInTheDocument()
    await usuario.type(screen.getByLabelText('E-mail que você usou na compra'), 'maria@teste.dev')
    await usuario.click(screen.getByRole('button', { name: 'Receber de novo' }))

    await waitFor(() => expect(corpos).toHaveLength(1))
    expect(corpos[0]?.email).toBe('maria@teste.dev')
    expect(await screen.findByText(/Se você comprou com este e-mail/)).toBeInTheDocument()
  })

  it('leva de volta à loja da turma', async () => {
    servidor.use(http.get(LOJA, () => HttpResponse.json(loja())))
    const usuario = userEvent.setup()
    const { router } = abrir()

    await usuario.click(await screen.findByRole('button', { name: 'Voltar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/loja/f-1'))
  })
})
