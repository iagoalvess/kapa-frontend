import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { ROTAS } from '@/config/rotas'
import { EMAIL_DE_SUPORTE } from '@/lib/suporte'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import DescadastroPage from './DescadastroPage'

const DESCADASTRO = `${env.VITE_API_URL}/api/v1/privacidade/descadastro`

describe('DescadastroPage', () => {
  /** Abrir a página não tira ninguém da lista: antivírus de e-mail visitam o link antes da pessoa. */
  it('só sai depois do clique, mandando o token do link, e diz que está pronto', async () => {
    let token: string | null = null
    let chamadas = 0
    servidor.use(
      http.post(DESCADASTRO, ({ request }) => {
        chamadas++
        token = new URL(request.url).searchParams.get('token')
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderizar(<DescadastroPage />, `${ROTAS.descadastro}?token=abc.123.xyz`)

    const botao = await screen.findByRole('button', { name: 'Não quero mais receber' })
    expect(chamadas).toBe(0)

    await userEvent.click(botao)

    expect(await screen.findByRole('heading', { name: 'Pronto, você não recebe mais' })).toBeInTheDocument()
    expect(token).toBe('abc.123.xyz')
    expect(screen.queryByText(/Minha privacidade/i)).not.toBeInTheDocument()
  })

  it('sem token, oferece o suporte sem exigir login', async () => {
    renderizar(<DescadastroPage />, ROTAS.descadastro)

    expect(await screen.findByRole('heading', { name: 'Link incompleto' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Falar com o suporte' })).toHaveAttribute(
      'href',
      `mailto:${EMAIL_DE_SUPORTE}?subject=Descadastro%20de%20marketing`,
    )
  })
})
