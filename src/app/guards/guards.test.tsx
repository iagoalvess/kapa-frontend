import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { PERFIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { sessao } from '@/lib/http/sessao'
import { ExigeAutenticacao } from './ExigeAutenticacao'
import { ExigePerfil } from './ExigePerfil'

/**
 * Monta um access token com as claims pedidas. A assinatura é irrelevante: `sessao.autenticar`
 * só lê o corpo.
 */
function tokenCom(perfis: string[]): string {
  const corpo = { sub: 'u-1', name: 'Teste', email: 'teste@exemplo.com', role: perfis }
  const base64 = btoa(JSON.stringify(corpo)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')

  return `cabecalho.${base64}.assinatura`
}

function entrar(perfis: string[]) {
  sessao.autenticar({
    accessToken: tokenCom(perfis),
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
    ],
    { initialEntries: [rotaInicial] },
  )

  return render(<RouterProvider router={router} />)
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
