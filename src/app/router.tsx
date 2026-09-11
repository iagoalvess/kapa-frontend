import { createBrowserRouter } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { ExigeAutenticacao } from './guards/ExigeAutenticacao'
import { ExigeFormatura } from './guards/ExigeFormatura'
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
        path: ROTAS.criarConta,
        lazy: pagina(() => import('@/features/auth/pages/CriarContaPage')),
      },
      {
        path: ROTAS.esqueciSenha,
        lazy: pagina(() => import('@/features/auth/pages/EsqueciSenhaPage')),
      },
      // Os links dos e-mails caem nestas duas; ficam fora da guarda porque quem clica pode estar
      // num aparelho sem sessão.
      {
        path: ROTAS.redefinirSenha,
        lazy: pagina(() => import('@/features/auth/pages/RedefinirSenhaPage')),
      },
      {
        path: ROTAS.confirmarEmail,
        lazy: pagina(() => import('@/features/auth/pages/ConfirmarEmailPage')),
      },
      {
        Component: ExigeAutenticacao,
        children: [
          {
            Component: LayoutApp,
            children: [
              // Dentro do layout de propósito: quem cai aqui sem formatura precisa continuar
              // conseguindo sair da conta, e o cabeçalho já traz o botão.
              {
                path: ROTAS.selecionarFormatura,
                lazy: pagina(() => import('@/features/formaturas/pages/SelecaoDeFormaturaPage')),
              },
              // Senha é da conta, não da turma: não depende de formatura selecionada.
              {
                path: ROTAS.alterarSenha,
                lazy: pagina(() => import('@/features/auth/pages/AlterarSenhaPage')),
              },
              {
                Component: ExigeFormatura,
                children: [{ index: true, Component: PaginaInicial }],
              },
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
