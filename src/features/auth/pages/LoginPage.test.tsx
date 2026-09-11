import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import LoginPage from './LoginPage'

const LOGIN = `${env.VITE_API_URL}/api/v1/auth/login`

describe('LoginPage', () => {
  it('autentica e guarda a sessão', async () => {
    servidor.use(
      http.post(LOGIN, () =>
        HttpResponse.json({
          accessToken: 'token',
          expiraEm: new Date().toISOString(),
          refreshToken: 'refresh',
        }),
      ),
    )

    renderizar(<LoginPage />)

    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-correta')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(sessao.accessToken()).toBe('token')
    })
  })

  it('mostra a mensagem que a API devolveu quando as credenciais não conferem', async () => {
    servidor.use(
      http.post(LOGIN, () =>
        HttpResponse.json(
          { status: 401, title: 'Não autorizado', detail: 'E-mail ou senha inválidos.' },
          { status: 401 },
        ),
      ),
    )

    renderizar(<LoginPage />)

    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.')
  })

  it('não chama a API quando o e-mail é inválido', async () => {
    renderizar(<LoginPage />)

    await userEvent.type(screen.getByLabelText('E-mail'), 'nao-e-email')
    await userEvent.type(screen.getByLabelText('Senha'), 'qualquer')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    // Sem handler de login registrado: se a requisição saísse, o MSW derrubaria o teste.
    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
  })
})
