import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import AlterarSenhaPage from './AlterarSenhaPage'

const ALTERAR = `${env.VITE_API_URL}/api/v1/conta/alterar-senha`

async function trocar(senhaAtual: string) {
  await userEvent.type(screen.getByLabelText('Senha atual'), senhaAtual)
  await userEvent.type(screen.getByLabelText('Nova senha'), 'NovaSenha@123')
  await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'NovaSenha@123')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }))
}

describe('AlterarSenhaPage', () => {
  beforeEach(() => {
    sessao.autenticar({ accessToken: 'token', expiraEm: new Date().toISOString() })
  })

  it('troca a senha e encerra a sessão local, porque a API derrubou todas', async () => {
    servidor.use(http.post(ALTERAR, () => new HttpResponse(null, { status: 204 })))

    renderizar(<AlterarSenhaPage />)
    await trocar('SenhaAtual@123')

    await waitFor(() => {
      expect(sessao.accessToken()).toBeNull()
    })
  })

  it('mostra a senha atual errada embaixo do campo da senha atual', async () => {
    servidor.use(
      http.post(ALTERAR, () =>
        HttpResponse.json(
          { status: 400, errors: { senhaAtual: ['A senha atual está incorreta.'] } },
          { status: 400 },
        ),
      ),
    )

    renderizar(<AlterarSenhaPage />)
    await trocar('Errada@123')

    expect(await screen.findByText('A senha atual está incorreta.')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveAttribute('aria-invalid', 'true')
    expect(sessao.accessToken()).toBe('token')
  })
})
