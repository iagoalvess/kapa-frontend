import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import { DialogoDeSenha } from './DialogoDeSenha'

const ALTERAR = `${env.VITE_API_URL}/api/v1/conta/alterar-senha`

async function trocar(senha_atual: string) {
  await userEvent.click(screen.getByRole('button', { name: 'Alterar senha' }))
  await userEvent.type(await screen.findByLabelText('Senha atual'), senha_atual)
  await userEvent.type(screen.getByLabelText('Nova senha'), 'NovaSenha@123')
  await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'NovaSenha@123')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
}

describe('DialogoDeSenha', () => {
  beforeEach(() => {
    sessao.autenticar({ access_token: 'token', expira_em: new Date().toISOString() })
  })

  it('troca a senha e encerra a sessão local, porque a API derrubou todas', async () => {
    servidor.use(http.post(ALTERAR, () => new HttpResponse(null, { status: 204 })))

    renderizar(<DialogoDeSenha />)
    await trocar('SenhaAtual@123')

    await waitFor(() => {
      expect(sessao.accessToken()).toBeNull()
    })
  })

  it('mostra a senha atual errada embaixo do campo da senha atual', async () => {
    servidor.use(
      http.post(ALTERAR, () =>
        HttpResponse.json(
          { status: 400, errors: { senha_atual: ['A senha atual está incorreta.'] } },
          { status: 400 },
        ),
      ),
    )

    renderizar(<DialogoDeSenha />)
    await trocar('Errada@123')

    expect(await screen.findByText('A senha atual está incorreta.')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveAttribute('aria-invalid', 'true')
    // O diálogo fica aberto com o erro: fechar apagaria o que a pessoa acabou de digitar.
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(sessao.accessToken()).toBe('token')
  })

  it('reabrir não traz o que foi digitado antes — é senha', async () => {
    renderizar(<DialogoDeSenha />)

    await userEvent.click(screen.getByRole('button', { name: 'Alterar senha' }))
    await userEvent.type(await screen.findByLabelText('Nova senha'), 'NovaSenha@123')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    await userEvent.click(screen.getByRole('button', { name: 'Alterar senha' }))
    expect(await screen.findByLabelText('Nova senha')).toHaveValue('')
  })
})
