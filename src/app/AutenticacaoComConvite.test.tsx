import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS, PERFIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useEntrar, useRegistrar } from '@/features/auth/hooks/useAutenticacao'
import ConvitePage from '@/features/convites/pages/ConvitePage'
import { convitePendente } from '@/lib/convitePendente'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { ExigeAutenticacao } from './guards/ExigeAutenticacao'
import { ExigeFormatura } from './guards/ExigeFormatura'
import { SomenteVisitante } from './guards/SomenteVisitante'

const base = env.VITE_API_URL
const convite = `${base}/api/v1/convites/tk-1`

function par(formaturaId?: string) {
  const claims = {
    sub: 'u-1',
    name: 'Ana',
    email: 'ana@example.test',
    role: [PERFIS.usuario],
    ...(formaturaId ? { formatura_id: formaturaId, papel: PAPEIS.formando } : {}),
  }
  return {
    access_token: `c.${btoa(JSON.stringify(claims))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  }
}

/** Exercita a mutação real dentro das guardas que desmontam a tela de entrada. */
function Entrada({ modo }: { modo: 'login' | 'registrar' }) {
  const entrar = useEntrar()
  const registrar = useRegistrar()
  const dados = { email: 'ana@example.test', senha: 'Teste@2026' }
  return (
    <button
      onClick={() =>
        modo === 'login'
          ? entrar.mutate(dados)
          : registrar.mutate({
              ...dados,
              nome: 'Ana',
              aceites: [],
              receber_comunicacao_do_kapa: false,
            })
      }
    >
      Continuar
    </button>
  )
}

function abrir(modo: 'login' | 'registrar') {
  const rota = modo === 'login' ? ROTAS.login : ROTAS.criarConta
  const router = createMemoryRouter(
    [
      { element: <SomenteVisitante />, children: [{ path: rota, element: <Entrada modo={modo} /> }] },
      { path: `${ROTAS.convite}/:token`, element: <ConvitePage /> },
      {
        element: <ExigeAutenticacao />,
        children: [
          {
            element: <ExigeFormatura />,
            children: [{ path: ROTAS.inicio, element: <p>Painel da turma</p> }],
          },
          { path: ROTAS.selecionarFormatura, element: <p>Sem formatura</p> },
        ],
      },
    ],
    { initialEntries: [rota] },
  )
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('Autenticação pelo convite com as guardas reais', () => {
  afterEach(() => {
    sessao.encerrar()
    convitePendente.descartar()
  })

  it.each(['login', 'registrar'] as const)('%s espera o aceite e entra uma única vez', async (modo) => {
    let liberar: (() => void) | undefined
    const liberacao = new Promise<void>((resolve) => {
      liberar = resolve
    })
    const parInicial = par()
    let chamadas = 0
    let autorizacao: string | null = null
    servidor.use(
      http.post(`${base}/api/v1/auth/${modo}`, () => HttpResponse.json(parInicial)),
      http.get(convite, () =>
        HttpResponse.json({ turma: 'Turma teste', instituicao: 'Universidade', papel: PAPEIS.formando }),
      ),
      http.post(`${convite}/aceitar`, async ({ request }) => {
        chamadas++
        autorizacao = request.headers.get('Authorization')
        await liberacao
        return HttpResponse.json(par('f-1'))
      }),
    )
    convitePendente.guardar('tk-1')
    const router = abrir(modo)
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    try {
      await waitFor(() => expect(chamadas).toBe(1))
      expect(sessao.estado().autenticado).toBe(false)
      expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
      expect(autorizacao).toBe(`Bearer ${parInicial.access_token}`)
    } finally {
      liberar?.()
    }

    expect(await screen.findByText('Painel da turma')).toBeInTheDocument()
    expect(chamadas).toBe(1)
    expect(sessao.estado().usuario?.formaturaId).toBe('f-1')
    expect(convitePendente.ler()).toBeNull()
    expect(router.state.location.pathname).toBe(ROTAS.inicio)
  })

  it('um convite pessoal recusado explica a confirmação de e-mail, sem perder o convite', async () => {
    servidor.use(
      http.post(`${base}/api/v1/auth/registrar`, () => HttpResponse.json(par())),
      http.get(convite, () =>
        HttpResponse.json({ turma: 'Turma teste', instituicao: 'Universidade', papel: PAPEIS.formando }),
      ),
      http.post(`${convite}/aceitar`, () =>
        HttpResponse.json(
          { codigo: 'convite.email_nao_confirmado', detail: 'Confirme seu e-mail para entrar.' },
          { status: 403 },
        ),
      ),
    )
    convitePendente.guardar('tk-1')
    const router = abrir('registrar')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(await screen.findByRole('button', { name: 'Já confirmei, entrar' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Confirme seu e-mail para entrar.')
    expect(screen.queryByText('Sem formatura')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`${ROTAS.convite}/tk-1`)
  })
})
