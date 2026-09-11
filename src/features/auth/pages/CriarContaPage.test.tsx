import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import CriarContaPage from './CriarContaPage'

const REGISTRAR = `${env.VITE_API_URL}/api/v1/auth/registrar`

async function preencher(senha = 'Senha@Forte123') {
  await userEvent.type(screen.getByLabelText('Nome'), 'Ana')
  await userEvent.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com')
  await userEvent.type(screen.getByLabelText('Senha'), senha)
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
}

describe('CriarContaPage', () => {
  beforeEach(() => sessao.encerrar())

  it('cria a conta e já entra com a sessão devolvida', async () => {
    servidor.use(
      http.post(REGISTRAR, () =>
        HttpResponse.json({
          accessToken: 'token-novo',
          expiraEm: new Date().toISOString(),
          refreshToken: null,
        }),
      ),
    )

    renderizar(<CriarContaPage />)
    await preencher()

    await waitFor(() => {
      expect(sessao.accessToken()).toBe('token-novo')
    })
  })

  it('mostra o e-mail já usado embaixo do campo de e-mail', async () => {
    servidor.use(
      http.post(REGISTRAR, () =>
        HttpResponse.json(
          { status: 409, detail: 'Já existe uma conta com este e-mail.', codigo: 'usuario.email_em_uso' },
          { status: 409 },
        ),
      ),
    )

    renderizar(<CriarContaPage />)
    await preencher()

    expect(await screen.findByText('Já existe uma conta com este e-mail.')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
  })

  it('mostra a política de senha que a API recusou embaixo do campo de senha', async () => {
    servidor.use(
      http.post(REGISTRAR, () =>
        HttpResponse.json(
          { status: 400, errors: { senha: ['A senha deve ter no mínimo 10 caracteres.'] } },
          { status: 400 },
        ),
      ),
    )

    renderizar(<CriarContaPage />)
    await preencher('curta')

    expect(await screen.findByText('A senha deve ter no mínimo 10 caracteres.')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true')
  })
})
