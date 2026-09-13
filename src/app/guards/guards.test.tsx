import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { useState } from 'react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS, PERFIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import AlterarSenhaPage from '@/features/auth/pages/AlterarSenhaPage'
import { useEstadoDeNavegacao } from '@/hooks/useEstadoDeNavegacao'
import { convitePendente } from '@/lib/convitePendente'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { ExigeAceites } from './ExigeAceites'
import { ExigeAutenticacao } from './ExigeAutenticacao'
import { ExigeFormatura } from './ExigeFormatura'
import { ExigePapel } from './ExigePapel'
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

  /** O convite aberto sem sessão sobrevive ao cadastro: quem acabou de entrar volta para ele. */
  it('devolve ao convite quem entrou com um convite pendente', () => {
    convitePendente.guardar('tk-1')
    entrar([PERFIS.usuario])

    const router = createMemoryRouter(
      [
        { element: <ExigeAutenticacao />, children: [{ path: ROTAS.inicio, element: <p>tela inicial</p> }] },
        { path: `${ROTAS.convite}/:token`, element: <p>tela do convite</p> },
      ],
      { initialEntries: [ROTAS.inicio] },
    )
    render(<RouterProvider router={router} />)

    expect(screen.getByText('tela do convite')).toBeInTheDocument()
    convitePendente.descartar()
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

/** Entra numa formatura com o papel pedido. */
function entrarComPapel(papel: string) {
  const corpo = {
    sub: 'u-1',
    name: 'Teste',
    email: 'teste@exemplo.com',
    role: [PERFIS.usuario],
    formatura_id: 'f-1',
    papel,
  }
  const base64 = btoa(JSON.stringify(corpo)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
  sessao.autenticar({
    accessToken: `cabecalho.${base64}.assinatura`,
    expiraEm: new Date(Date.now() + 900_000).toISOString(),
  })
}

describe('ExigePapel', () => {
  it('devolve para o início quem não tem o papel', () => {
    entrarComPapel(PAPEIS.formando)
    renderizarGuarda(<ExigePapel papeis={[PAPEIS.tesoureiro, PAPEIS.comissao]} />)

    expect(screen.getByText('tela inicial')).toBeInTheDocument()
  })

  it('deixa passar quem tem um dos papéis', () => {
    entrarComPapel(PAPEIS.comissao)
    renderizarGuarda(<ExigePapel papeis={[PAPEIS.tesoureiro, PAPEIS.comissao]} />)

    expect(screen.getByText('conteúdo protegido')).toBeInTheDocument()
  })

  /** Espelha `Politicas.ExigirPapel`: o Presidente é coringa dentro da formatura. */
  it('deixa o Presidente passar em papel que ele não tem', () => {
    entrarComPapel(PAPEIS.presidente)
    renderizarGuarda(<ExigePapel papeis={[PAPEIS.tesoureiro]} />)

    expect(screen.getByText('conteúdo protegido')).toBeInTheDocument()
  })

  /** Papel sem formatura não significa nada — o backend recusa, a tela também não mostra. */
  it('sem formatura selecionada ninguém passa', () => {
    entrar([PERFIS.administrador])
    renderizarGuarda(<ExigePapel papeis={[PAPEIS.formando]} />)

    expect(screen.getByText('tela inicial')).toBeInTheDocument()
  })
})

const MEUS_ACEITES = `${env.VITE_API_URL}/api/v1/legal/meus-aceites`

/** Re-aceite de mentira: mostra o destino que a guarda deixou no `state`. */
function Reaceite() {
  return <p>re-aceite, voltar para {useEstadoDeNavegacao('de')}</p>
}

function renderizarComAceites(
  conteudo = <p>conteúdo protegido</p>,
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) {
  const router = createMemoryRouter(
    [
      { element: <ExigeAceites />, children: [{ path: '/protegida', element: conteudo }] },
      { path: ROTAS.aceitePendente, element: <Reaceite /> },
    ],
    { initialEntries: ['/protegida?aba=1'] },
  )
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('ExigeAceites', () => {
  it('leva ao re-aceite quem tem versão nova pendente, guardando o destino', async () => {
    servidor.use(
      http.get(MEUS_ACEITES, () =>
        HttpResponse.json({ historico: [], pendencias: [{ tipo: 'TermosDeUso', versao: '2' }] }),
      ),
    )
    entrar([PERFIS.usuario])
    renderizarComAceites()

    expect(await screen.findByText('re-aceite, voltar para /protegida?aba=1')).toBeInTheDocument()
  })

  it('deixa passar quem está em dia', async () => {
    servidor.use(http.get(MEUS_ACEITES, () => HttpResponse.json({ historico: [], pendencias: [] })))
    entrar([PERFIS.usuario])
    renderizarComAceites()

    expect(await screen.findByText('conteúdo protegido')).toBeInTheDocument()
  })

  /** Versão nova não bloqueia o produto: falhou a consulta, o aceite fica para o próximo acesso. */
  it('deixa passar se a consulta de pendências falhar', async () => {
    servidor.use(http.get(MEUS_ACEITES, () => new HttpResponse(null, { status: 500 })))
    entrar([PERFIS.usuario])
    renderizarComAceites()

    expect(await screen.findByText('conteúdo protegido')).toBeInTheDocument()
  })

  /**
   * Trocar de formatura limpa o cache e a pendência volta a carregar. Se a guarda desmontar a tela
   * nesse meio-tempo, o que a tela faria ao terminar se perde — a seleção de formatura ficava
   * parada em vez de levar ao destino.
   */
  it('não desmonta a tela quando o cache é limpo', async () => {
    let consultas = 0
    servidor.use(
      http.get(MEUS_ACEITES, () => {
        consultas++
        return HttpResponse.json({ historico: [], pendencias: [] })
      }),
    )
    entrar([PERFIS.usuario])
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    function Tela() {
      const [limpo, definirLimpo] = useState(false)
      // A mesma ordem de `useSelecionarFormatura`: sessão nova, depois o cache limpo.
      const limpar = () => {
        definirLimpo(true)
        entrar([PERFIS.usuario], 'f-2')
        queryClient.clear()
      }
      return <button onClick={limpar}>{limpo ? 'cache limpo' : 'limpar'}</button>
    }

    renderizarComAceites(<Tela />, queryClient)
    await userEvent.click(await screen.findByRole('button', { name: 'limpar' }))

    await waitFor(() => expect(consultas).toBe(2))
    expect(screen.getByRole('button', { name: 'cache limpo' })).toBeInTheDocument()
  })
})
