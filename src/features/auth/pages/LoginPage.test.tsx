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

async function informarEmail(email: string) {
  await userEvent.type(screen.getByLabelText('Qual seu e-mail?'), email)
  await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
}

async function informarSenha(senha: string) {
  await userEvent.type(await screen.findByLabelText('Sua senha'), senha)
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('LoginPage', () => {
  it('autentica em duas etapas e guarda a sessão', async () => {
    servidor.use(
      http.post(LOGIN, () =>
        HttpResponse.json({
          access_token: 'token',
          expira_em: new Date().toISOString(),
          refreshToken: 'refresh',
        }),
      ),
    )

    renderizar(<LoginPage />)

    await informarEmail('ana@exemplo.com')
    expect(screen.getByLabelText('Sua senha')).toHaveFocus()
    await informarSenha('senha-correta')

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

    await informarEmail('ana@exemplo.com')
    await informarSenha('errada')

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.')
  })

  it('não avança para a senha quando o e-mail é inválido', async () => {
    renderizar(<LoginPage />)

    // Sem handler de login registrado: se a requisição saísse, o MSW derrubaria o teste.
    await informarEmail('nao-e-email')

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Sua senha')).not.toBeInTheDocument()
  })

  it('volta para a etapa do e-mail quando a API aponta erro nele', async () => {
    servidor.use(
      http.post(LOGIN, () =>
        HttpResponse.json(
          { status: 400, title: 'Dados inválidos', errors: { Email: ['E-mail não cadastrado.'] } },
          { status: 400 },
        ),
      ),
    )

    renderizar(<LoginPage />)

    await informarEmail('ana@exemplo.com')
    await informarSenha('qualquer')

    expect(await screen.findByText('E-mail não cadastrado.')).toBeInTheDocument()
    expect(screen.getByLabelText('Qual seu e-mail?')).toHaveValue('ana@exemplo.com')
  })

  it('permite trocar o e-mail na etapa da senha', async () => {
    renderizar(<LoginPage />)

    await informarEmail('ana@exemplo.com')
    await userEvent.click(screen.getByRole('button', { name: 'Trocar' }))

    expect(screen.getByLabelText('Qual seu e-mail?')).toHaveValue('ana@exemplo.com')
    expect(screen.getByLabelText('Qual seu e-mail?')).toHaveFocus()
  })

  it('oferece reenviar a confirmação quando o e-mail ainda não foi confirmado', async () => {
    let reenviadoPara: unknown
    servidor.use(
      http.post(LOGIN, () =>
        HttpResponse.json(
          {
            status: 403,
            detail: 'Confirme seu e-mail antes de entrar.',
            codigo: 'auth.email_nao_confirmado',
          },
          { status: 403 },
        ),
      ),
      http.post(`${env.VITE_API_URL}/api/v1/conta/reenviar-confirmacao`, async ({ request }) => {
        reenviadoPara = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderizar(<LoginPage />)

    await informarEmail('ana@exemplo.com')
    await informarSenha('senha-correta')
    await userEvent.click(await screen.findByRole('button', { name: 'Reenviar e-mail de confirmação' }))

    expect(await screen.findByText('Enviamos um novo link para ana@exemplo.com.')).toBeInTheDocument()
    expect(reenviadoPara).toEqual({ email: 'ana@exemplo.com' })
  })

  it('mostra o aviso deixado pela tela anterior', () => {
    renderizar(<LoginPage />, { pathname: '/login', state: { aviso: 'Senha redefinida.' } })

    expect(screen.getByRole('status')).toHaveTextContent('Senha redefinida.')
  })
})
