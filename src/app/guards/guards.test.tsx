import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS, PERFIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import AlterarSenhaPage from '@/features/auth/pages/AlterarSenhaPage'
import { useEstadoDeNavegacao } from '@/hooks/useEstadoDeNavegacao'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { ExigeAutenticacao } from './ExigeAutenticacao'
import { ExigeFormatura } from './ExigeFormatura'
import { ExigePerfil } from './ExigePerfil'

/**
 * Monta um access token com as claims pedidas. A assinatura é irrelevante: `sessao.autenticar`
 * só lê o corpo.
 */
function tokenCom(perfis: string[], formaturaId?: string): string {
  const corpo = {
    sub: 'u-1',
    name: 'Teste',
    email: 'teste@exemplo.com',
    role: perfis,
    ...(formaturaId === undefined ? {} : { formatura_id: formaturaId, papel: PAPEIS.formando }),
  }
  const base64 = btoa(JSON.stringify(corpo)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')

  return `cabecalho.${base64}.assinatura`
}

function entrar(perfis: string[], formaturaId?: string) {
  sessao.autenticar({
    accessToken: tokenCom(perfis, formaturaId),
    expiraEm: new Date(Date.now() + 900_000).toISOString(),
  })
}

/** Renderiza o guarda num ramo de rotas, partindo de `rotaInicial`. */
function renderizarGuarda(guarda: React.ReactElement, rotaInicial = '/protegida') {
  const router = createMemoryRouter(
    [
      {
        element: guarda,
        children: [{ path: '/protegida', element: <p>conteúdo protegido</p> }],
      },
      { path: ROTAS.login, element: <p>tela de login</p> },
      { path: ROTAS.inicio, element: <p>tela inicial</p> },
      { path: ROTAS.selecionarFormatura, element: <p>escolha a formatura</p> },
    ],
    { initialEntries: [rotaInicial] },
  )

  return render(<RouterProvider router={router} />)
}

/** Login de mentira: mostra o aviso que a tela anterior deixou no `state`. */
function Login() {
  return <p>{useEstadoDeNavegacao('aviso') ?? 'sem aviso'}</p>
}

afterEach(() => {
  sessao.encerrar()
})

describe('ExigeAutenticacao', () => {
  it('manda para o login quem não está autenticado', () => {
    renderizarGuarda(<ExigeAutenticacao />)

    expect(screen.getByText('tela de login')).toBeInTheDocument()
    expect(screen.queryByText('conteúdo protegido')).not.toBeInTheDocument()
  })

  it('deixa passar quem está autenticado', () => {
    entrar([PERFIS.usuario])

    renderizarGuarda(<ExigeAutenticacao />)

    expect(screen.getByText('conteúdo protegido')).toBeInTheDocument()
  })

  /**
   * Trocar a senha encerra a sessão dentro do ramo protegido. Se a guarda redirecionar antes da
   * navegação da tela terminar, o `state` dela vence e o aviso some do login.
   */
  it('não atropela o aviso de quem sai trocando a senha', async () => {
    servidor.use(
      http.post(
        `${env.VITE_API_URL}/api/v1/conta/alterar-senha`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    )
    entrar([PERFIS.usuario])

    const router = createMemoryRouter(
      [
        {
          element: <ExigeAutenticacao />,
          children: [{ path: ROTAS.alterarSenha, element: <AlterarSenhaPage /> }],
        },
        { path: ROTAS.login, element: <Login /> },
      ],
      { initialEntries: [ROTAS.alterarSenha] },
    )
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    await userEvent.type(screen.getByLabelText('Senha atual'), 'SenhaAtual@123')
    await userEvent.type(screen.getByLabelText('Nova senha'), 'NovaSenha@123')
    await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'NovaSenha@123')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(await screen.findByText(/Senha alterada/)).toBeInTheDocument()
  })
})

describe('ExigePerfil', () => {
  it('devolve para o início quem não tem o perfil exigido', () => {
    entrar([PERFIS.usuario])

    renderizarGuarda(<ExigePerfil perfil={PERFIS.administrador} />)

    expect(screen.getByText('tela inicial')).toBeInTheDocument()
    expect(screen.queryByText('conteúdo protegido')).not.toBeInTheDocument()
  })

  it('deixa passar quem tem o perfil exigido', () => {
    entrar([PERFIS.administrador])

    renderizarGuarda(<ExigePerfil perfil={PERFIS.administrador} />)

    expect(screen.getByText('conteúdo protegido')).toBeInTheDocument()
  })

  /**
   * O administrador passa em qualquer política, espelhando `Politicas.ExigirPerfil` no backend.
   * Se as duas pontas divergirem, a tela some para quem a API deixaria entrar.
   */
  it('deixa o administrador passar em perfil que ele não tem', () => {
    entrar([PERFIS.administrador])

    renderizarGuarda(<ExigePerfil perfil={PERFIS.usuario} />)

    expect(screen.getByText('conteúdo protegido')).toBeInTheDocument()
  })
})

describe('ExigeFormatura', () => {
  /**
   * Sem a claim, a API responde 403 `formatura.nao_selecionada` e toda consulta volta vazia. A
   * guarda evita que isso apareça como uma tela em branco sem explicação.
   */
  it('manda para a seleção quem ainda não escolheu formatura', () => {
    entrar([PERFIS.usuario])

    renderizarGuarda(<ExigeFormatura />)

    expect(screen.getByText('escolha a formatura')).toBeInTheDocument()
    expect(screen.queryByText('conteúdo protegido')).not.toBeInTheDocument()
  })

  it('deixa passar quem tem formatura selecionada', () => {
    entrar([PERFIS.usuario], 'f-1')

    renderizarGuarda(<ExigeFormatura />)

    expect(screen.getByText('conteúdo protegido')).toBeInTheDocument()
  })
})
