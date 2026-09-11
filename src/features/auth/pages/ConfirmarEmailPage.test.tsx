import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import ConfirmarEmailPage from './ConfirmarEmailPage'

const CONFIRMAR = `${env.VITE_API_URL}/api/v1/conta/confirmar-email`
const REENVIAR = `${env.VITE_API_URL}/api/v1/conta/reenviar-confirmacao`
const LINK = '/confirmar-email?email=ana%40exemplo.com&token=abc-123'

describe('ConfirmarEmailPage', () => {
  it('só confirma no clique, com o e-mail e o token do link', async () => {
    let enviado: unknown
    servidor.use(
      http.post(CONFIRMAR, async ({ request }) => {
        enviado = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderizar(<ConfirmarEmailPage />, LINK)
    expect(enviado).toBeUndefined()

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar e-mail' }))

    expect(await screen.findByRole('heading', { name: 'E-mail confirmado' })).toBeInTheDocument()
    expect(enviado).toEqual({ email: 'ana@exemplo.com', token: 'abc-123' })
  })

  it('oferece reenviar a confirmação quando o link expirou', async () => {
    servidor.use(
      http.post(CONFIRMAR, () =>
        HttpResponse.json(
          {
            status: 400,
            codigo: 'conta.link_invalido',
            errors: { token: ['Este link é inválido ou expirou.'] },
          },
          { status: 400 },
        ),
      ),
      http.post(REENVIAR, () => new HttpResponse(null, { status: 204 })),
    )

    renderizar(<ConfirmarEmailPage />, LINK)
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar e-mail' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Enviar novo link' }))

    expect(await screen.findByRole('status')).toHaveTextContent('ana@exemplo.com')
  })
})
