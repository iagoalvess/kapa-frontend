import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import RedefinirSenhaPage from './RedefinirSenhaPage'

const REDEFINIR = `${env.VITE_API_URL}/api/v1/conta/redefinir-senha`
const LINK = { pathname: '/redefinir-senha', search: '?email=ana%40exemplo.com&token=abc-123' }

async function definirSenha(novaSenha: string, confirmacao = novaSenha) {
  await userEvent.type(screen.getByLabelText('Nova senha'), novaSenha)
  await userEvent.type(screen.getByLabelText('Repita a nova senha'), confirmacao)
  await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }))
}

describe('RedefinirSenhaPage', () => {
  it('manda o e-mail e o token do link junto com a senha nova e encerra a sessão local', async () => {
    let enviado: unknown
    servidor.use(
      http.post(REDEFINIR, async ({ request }) => {
        enviado = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    sessao.autenticar({ accessToken: 'token-antigo', expiraEm: new Date().toISOString() })

    renderizar(<RedefinirSenhaPage />, LINK)
    await definirSenha('NovaSenha@123')

    await waitFor(() => {
      expect(enviado).toEqual({ email: 'ana@exemplo.com', token: 'abc-123', novaSenha: 'NovaSenha@123' })
    })
    expect(sessao.accessToken()).toBeNull()
  })

  it('não chama a API quando as duas senhas não conferem', async () => {
    renderizar(<RedefinirSenhaPage />, LINK)

    // Sem handler registrado: se a requisição saísse, o MSW derrubaria o teste.
    await definirSenha('NovaSenha@123', 'OutraSenha@123')

    expect(await screen.findByText('As senhas não conferem.')).toBeInTheDocument()
  })

  it('oferece um link novo quando a API diz que o link expirou', async () => {
    servidor.use(
      http.post(REDEFINIR, () =>
        HttpResponse.json(
          {
            status: 400,
            codigo: 'conta.link_invalido',
            errors: { token: ['Este link é inválido ou expirou.'] },
          },
          { status: 400 },
        ),
      ),
    )

    renderizar(<RedefinirSenhaPage />, LINK)
    await definirSenha('NovaSenha@123')

    expect(await screen.findByRole('heading', { name: 'Link inválido' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pedir um novo link' })).toBeInTheDocument()
  })

  /** O e-mail do link não é campo da tela: aplicado ao formulário, o erro sumiria sem aparecer. */
  it('trata e-mail malformado no link como link inválido', async () => {
    servidor.use(
      http.post(REDEFINIR, () =>
        HttpResponse.json({ status: 400, errors: { email: ['E-mail inválido.'] } }, { status: 400 }),
      ),
    )

    renderizar(<RedefinirSenhaPage />, LINK)
    await definirSenha('NovaSenha@123')

    expect(await screen.findByRole('heading', { name: 'Link inválido' })).toBeInTheDocument()
  })

  it('reconhece o link incompleto sem chamar a API', () => {
    renderizar(<RedefinirSenhaPage />, '/redefinir-senha?email=ana%40exemplo.com')

    expect(screen.getByRole('heading', { name: 'Link inválido' })).toBeInTheDocument()
  })
})
