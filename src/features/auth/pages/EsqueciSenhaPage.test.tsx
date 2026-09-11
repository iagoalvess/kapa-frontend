import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import EsqueciSenhaPage from './EsqueciSenhaPage'

const ESQUECI = `${env.VITE_API_URL}/api/v1/conta/esqueci-senha`

describe('EsqueciSenhaPage', () => {
  it('pede o link e responde sem revelar se a conta existe', async () => {
    let enviado: unknown
    servidor.use(
      http.post(ESQUECI, async ({ request }) => {
        enviado = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderizar(<EsqueciSenhaPage />)

    await userEvent.type(screen.getByLabelText('Qual seu e-mail?'), 'ana@exemplo.com')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Se houver uma conta com ana@exemplo.com')
    expect(enviado).toEqual({ email: 'ana@exemplo.com' })
  })

  it('traz o e-mail já digitado no login', () => {
    renderizar(<EsqueciSenhaPage />, { pathname: '/esqueci-senha', state: { email: 'ana@exemplo.com' } })

    expect(screen.getByLabelText('Qual seu e-mail?')).toHaveValue('ana@exemplo.com')
  })
})
