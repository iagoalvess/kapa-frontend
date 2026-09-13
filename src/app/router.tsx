import { createBrowserRouter } from 'react-router'
import { PAPEIS } from '@/config/perfis'
import { ROTAS, SUFIXO_DE_VERSAO } from '@/config/rotas'
import { ExigeAceites } from './guards/ExigeAceites'
import { ExigeAutenticacao } from './guards/ExigeAutenticacao'
import { ExigeFormatura } from './guards/ExigeFormatura'
import { ExigePapel } from './guards/ExigePapel'
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
      // Público: o convite chega por WhatsApp a quem ainda não tem conta. Com sessão, aceita sozinho.
      {
        path: `${ROTAS.convite}/:token`,
        lazy: pagina(() => import('@/features/convites/pages/ConvitePage')),
      },
      // Públicos: são lidos antes do cadastro, em nova aba, e cada versão tem link permanente.
      {
        path: ROTAS.termosDeUso + SUFIXO_DE_VERSAO,
        lazy: pagina(() => import('@/features/legal/pages/TermosPage')),
      },
      {
        path: ROTAS.privacidade + SUFIXO_DE_VERSAO,
        lazy: pagina(() => import('@/features/legal/pages/PrivacidadePage')),
      },
      {
        Component: ExigeAutenticacao,
        children: [
          {
            Component: LayoutApp,
            children: [
              // Fora de `ExigeAceites`, senão a guarda mandaria para cá quem já está aqui.
              {
                path: ROTAS.aceitePendente,
                lazy: pagina(() => import('@/features/legal/pages/ReaceitePage')),
              },
              {
                Component: ExigeAceites,
                children: [
                  // Dentro do layout de propósito: quem cai aqui sem formatura precisa continuar
                  // conseguindo sair da conta, e a barra lateral já traz o botão.
                  {
                    path: ROTAS.selecionarFormatura,
                    lazy: pagina(() => import('@/features/formaturas/pages/SelecaoDeFormaturaPage')),
                  },
                  // Criar é o caminho para ter uma formatura: não pode exigir uma.
                  {
                    path: ROTAS.novaFormatura,
                    handle: { titulo: 'Nova formatura' },
                    lazy: pagina(() => import('@/features/formaturas/pages/CriarFormaturaPage')),
                  },
                  // Senha é da conta, não da turma: não depende de formatura selecionada.
                  {
                    path: ROTAS.alterarSenha,
                    lazy: pagina(() => import('@/features/auth/pages/AlterarSenhaPage')),
                  },
                  {
                    Component: ExigeFormatura,
                    children: [
                      // `handle.titulo` é o título que o `LayoutApp` mostra no topo da tela.
                      { index: true, handle: { titulo: 'Início' }, Component: PaginaInicial },
                      // Todo membro lê; o formulário só aparece para o Presidente.
                      {
                        path: ROTAS.dadosDaFormatura,
                        handle: { titulo: 'Dados da turma' },
                        lazy: pagina(
                          () => import('@/features/formaturas/pages/ConfiguracoesDaFormaturaPage'),
                        ),
                      },
                      // Todo membro tem o próprio cadastro — inclusive a comissão, que também se forma.
                      {
                        path: ROTAS.meuCadastro,
                        handle: { titulo: 'Meu cadastro' },
                        lazy: pagina(() => import('@/features/formandos/pages/MeuPerfilPage')),
                      },
                      // Gestão (matriz da Sprint 1): Tesoureiro e Comissão veem; o Presidente passa sempre.
                      {
                        element: <ExigePapel papeis={[PAPEIS.tesoureiro, PAPEIS.comissao]} />,
                        children: [
                          // Gestão lê; corrigir é só do Presidente (a API decide).
                          {
                            path: ROTAS.formandos,
                            handle: { titulo: 'Formandos' },
                            lazy: pagina(() => import('@/features/formandos/pages/ListaDeFormandosPage')),
                          },
                          {
                            path: `${ROTAS.formandos}/:usuarioId`,
                            handle: { titulo: 'Cadastro do formando' },
                            lazy: pagina(() => import('@/features/formandos/pages/DetalheDoFormandoPage')),
                          },
                          {
                            path: ROTAS.membros,
                            handle: { titulo: 'Membros' },
                            lazy: pagina(() => import('@/features/membros/pages/MembrosPage')),
                          },
                          // Convite de Formando é da Gestão; outro papel, só do Presidente (a API decide).
                          {
                            path: ROTAS.convites,
                            handle: { titulo: 'Convites' },
                            lazy: pagina(() => import('@/features/convites/pages/GestaoDeConvitesPage')),
                          },
                          // Assinatura: Gestão lê; contratar e cancelar são só do Presidente (a API decide).
                          {
                            path: ROTAS.assinatura,
                            handle: { titulo: 'Assinatura' },
                            lazy: pagina(() => import('@/features/assinaturas/pages/AssinaturaPage')),
                          },
                          {
                            path: ROTAS.planos,
                            handle: { titulo: 'Planos' },
                            lazy: pagina(() => import('@/features/assinaturas/pages/PlanosPage')),
                          },
                          {
                            path: ROTAS.retornoDoCheckout,
                            handle: { titulo: 'Pagamento' },
                            lazy: pagina(() => import('@/features/assinaturas/pages/RetornoDoCheckoutPage')),
                          },
                        ],
                      },
                    ],
                  },
                  // As rotas de feature entram aqui, com o título da tela no `handle`:
                  //   { path: ROTAS.produtos, handle: { titulo: 'Produtos' }, lazy: pagina(() => import('@/features/produtos/pages/ProdutosPage')) }
                  // Restrita a um perfil? Envolva num ramo com <ExigePerfil perfil={...} />.
                  // Restrita a um papel da formatura? Com <ExigePapel papeis={[...]} />.
                ],
              },
            ],
          },
        ],
      },
      { path: '*', Component: PaginaNaoEncontrada },
    ],
  },
])
