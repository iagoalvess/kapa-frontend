import { createBrowserRouter } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { ExigeAutenticacao } from './guards/ExigeAutenticacao'
import { LayoutApp } from './layouts/LayoutApp'
import { PaginaDeErro } from './PaginaDeErro'
import { PaginaInicial } from './PaginaInicial'
import { PaginaNaoEncontrada } from './PaginaNaoEncontrada'

/**
 * Carrega uma página sob demanda.
 *
 * Cada `lazy` vira um arquivo separado no build: abrir o login não baixa o resto da aplicação.
 * As páginas de feature usam `export default` justamente para caber nesta única linha.
 */
const pagina = (importar: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await importar()).default,
})

export const router = createBrowserRouter([
  {
    errorElement: <PaginaDeErro />,
    children: [
      {
        path: ROTAS.login,
        lazy: pagina(() => import('@/features/auth/pages/LoginPage')),
      },
      {
        Component: ExigeAutenticacao,
        children: [
          {
            Component: LayoutApp,
            children: [
              { index: true, Component: PaginaInicial },
              // As rotas de feature entram aqui:
              //   { path: ROTAS.produtos, lazy: pagina(() => import('@/features/produtos/pages/ProdutosPage')) }
              // Restrita a um perfil? Envolva num ramo com <ExigePerfil perfil={...} />.
            ],
          },
        ],
      },
      { path: '*', Component: PaginaNaoEncontrada },
    ],
  },
])
