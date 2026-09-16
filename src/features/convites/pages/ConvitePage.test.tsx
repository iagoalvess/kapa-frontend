import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PERFIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { convitePendente } from '@/lib/convitePendente'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import ConvitePage from './ConvitePage'

const CONVITE = `${env.VITE_API_URL}/api/v1/convites/tk-1`
const TURMA = { turma: 'Medicina 2027.1', instituicao: 'Universidade Federal do Paraná', papel: 'Formando' }

function token(claims: Record<string, unknown>) {
  const corpo = { sub: 'u-1', name: 'Ana', email: 'ana@exemplo.com', role: [PERFIS.usuario], ...claims }
  return `c.${btoa(JSON.stringify(corpo))}.a`
}

function entrar(claims: Record<string, unknown> = {}) {
  sessao.autenticar({ access_token: token(claims), expira_em: new Date(Date.now() + 900_000).toISOString() })
}

function renderizar() {
  const router = createMemoryRouter(
    [
      { path: `${ROTAS.convite}/:token`, element: <ConvitePage /> },
      { path: ROTAS.inicio, element: <p>painel da turma</p> },
      { path: ROTAS.criarConta, element: <p>tela de cadastro</p> },
      { path: ROTAS.login, element: <p>tela de login</p> },
    ],
    { initialEntries: [`${ROTAS.convite}/tk-1`] },
  )

  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('ConvitePage', () => {
  afterEach(() => {
    sessao.encerrar()
    sessionStorage.clear()
  })

  it('sem sessão, mostra a turma e guarda o convite a caminho do cadastro', async () => {
    servidor.use(http.get(CONVITE, () => HttpResponse.json(TURMA)))

    renderizar()

    expect(await screen.findByRole('heading', { name: 'Medicina 2027.1' })).toBeInTheDocument()
    expect(screen.getByText('Universidade Federal do Paraná')).toBeInTheDocument()
    expect(screen.getByText('Formando')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Criar conta e entrar' }))

    expect(await screen.findByText('tela de cadastro')).toBeInTheDocument()
    expect(convitePendente.ler()).toBe('tk-1')
  })

  /** Inexistente, expirado, revogado e esgotado chegam iguais — e a tela também não diferencia. */
  it('convite inválido mostra a mensagem única, sem 404 cru', async () => {
    servidor.use(
      http.get(CONVITE, () =>
        HttpResponse.json({ status: 404, codigo: 'convite.invalido', detail: 'x' }, { status: 404 }),
      ),
    )

    renderizar()

    expect(
      await screen.findByText('Este convite não está mais disponível. Peça um novo à comissão.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para a página inicial' })).toBeInTheDocument()
  })

  /**
   * Com sessão aceita sozinho, sem mandar papel, e cai no painel já com a formatura nova no token —
   * mesmo vindo de outra turma.
   */
  it('com sessão, aceita sozinho e entra na turma com a sessão nova', async () => {
    let corpo: unknown
    let aceites = 0
    servidor.use(
      http.get(CONVITE, () => HttpResponse.json(TURMA)),
      http.post(`${CONVITE}/aceitar`, async ({ request }) => {
        aceites++
        corpo = await request.json()
        return HttpResponse.json({
          access_token: token({ formatura_id: 'f-nova', papel: 'Formando' }),
          expira_em: new Date(Date.now() + 900_000).toISOString(),
        })
      }),
    )
    convitePendente.guardar('tk-1')
    entrar({ formatura_id: 'f-antiga', papel: 'Presidente' })

    renderizar()

    expect(await screen.findByText('painel da turma')).toBeInTheDocument()
    expect(corpo).toEqual({})
    expect(aceites).toBe(1)
    expect(sessao.estado().usuario?.formaturaId).toBe('f-nova')
    expect(convitePendente.ler()).toBeNull()
  })

  it('e-mail diferente do convidado mostra o motivo da recusa', async () => {
    servidor.use(
      http.get(CONVITE, () => HttpResponse.json(TURMA)),
      http.post(`${CONVITE}/aceitar`, () =>
        HttpResponse.json(
          {
            status: 403,
            codigo: 'convite.email_divergente',
            detail: 'Este convite é pessoal e foi enviado para outro e-mail.',
          },
          { status: 403 },
        ),
      ),
    )
    entrar()

    renderizar()
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar na turma' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este convite é pessoal')
    await waitFor(() => expect(screen.getByRole('link', { name: 'Ir para o início' })).toBeInTheDocument())
  })

  /** Link repassado não põe ninguém numa turma sozinho: quem já estava logado decide no botão. */
  it('logado, sem ter começado pelo convite, só entra depois de confirmar com qual conta', async () => {
    let aceites = 0
    servidor.use(
      http.get(CONVITE, () => HttpResponse.json(TURMA)),
      http.post(`${CONVITE}/aceitar`, () => {
        aceites++
        return HttpResponse.json({
          access_token: token({ formatura_id: 'f-nova', papel: 'Formando' }),
          expira_em: new Date(Date.now() + 900_000).toISOString(),
        })
      }),
    )
    entrar()

    renderizar()

    expect(await screen.findByText('Você vai entrar como Ana (ana@exemplo.com).')).toBeInTheDocument()
    expect(aceites).toBe(0)

    await userEvent.click(screen.getByRole('button', { name: 'Entrar na turma' }))

    expect(await screen.findByText('painel da turma')).toBeInTheDocument()
    expect(aceites).toBe(1)
  })

  it('convite pessoal mostra para qual e-mail foi, mascarado', async () => {
    servidor.use(http.get(CONVITE, () => HttpResponse.json({ ...TURMA, email_mascarado: 'a*a@exemplo.com' })))

    renderizar()

    expect(await screen.findByText('Convite pessoal para a*a@exemplo.com')).toBeInTheDocument()
  })

  it('e-mail não confirmado oferece reenvio do link e nova tentativa', async () => {
    let reenviadoPara: unknown
    servidor.use(
      http.get(CONVITE, () => HttpResponse.json(TURMA)),
      http.post(`${CONVITE}/aceitar`, () =>
        HttpResponse.json(
          {
            status: 403,
            codigo: 'convite.email_nao_confirmado',
            detail: 'Confirme seu e-mail para aceitar.',
          },
          { status: 403 },
        ),
      ),
      http.post(`${env.VITE_API_URL}/api/v1/conta/reenviar-confirmacao`, async ({ request }) => {
        reenviadoPara = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    convitePendente.guardar('tk-1')
    entrar()

    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Confirme seu e-mail')
    expect(screen.getByRole('button', { name: 'Já confirmei, entrar' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reenviar e-mail de confirmação' }))

    expect(await screen.findByText('E-mail reenviado. Confira a caixa de entrada.')).toBeInTheDocument()
    expect(reenviadoPara).toEqual({ email: 'ana@exemplo.com' })
  })
})
