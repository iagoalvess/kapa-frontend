import { createBrowserRouter } from 'react-router'
import { PAPEIS } from '@/config/perfis'
import { ROTAS, SUFIXO_DE_VERSAO } from '@/config/rotas'
import { ExigeAceites } from './guards/ExigeAceites'
import { ExigeAutenticacao } from './guards/ExigeAutenticacao'
import { ExigeFormatura } from './guards/ExigeFormatura'
import { ExigePapel } from './guards/ExigePapel'
import { LayoutApp } from './layouts/LayoutApp'
import { LayoutDeOnboarding } from './layouts/LayoutDeOnboarding'
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
          // Fora de `ExigeAceites`, senão a guarda mandaria para cá quem já está aqui.
          {
            Component: LayoutApp,
            children: [
              {
                path: ROTAS.aceitePendente,
                lazy: pagina(() => import('@/features/legal/pages/ReaceitePage')),
              },
            ],
          },
          {
            Component: ExigeAceites,
            children: [
              // Onboarding: antes de ter formatura na sessão, fora do app. O layout traz o "Sair".
              {
                Component: LayoutDeOnboarding,
                children: [
                  {
                    path: ROTAS.selecionarFormatura,
                    lazy: pagina(() => import('@/features/formaturas/pages/SelecaoDeFormaturaPage')),
                  },
                  // Criar é o caminho para ter uma formatura: não pode exigir uma.
                  {
                    path: ROTAS.novaFormatura,
                    lazy: pagina(() => import('@/features/formaturas/pages/CriarFormaturaPage')),
                  },
                ],
              },
              {
                Component: LayoutApp,
                children: [
                  {
                    Component: ExigeFormatura,
                    children: [
                      // `handle.titulo` é o título que o `LayoutApp` mostra no topo da tela.
                      { index: true, handle: { titulo: 'Início' }, Component: PaginaInicial },
                      // Todo membro lê; o formulário é do Presidente, e a assinatura é da Gestão.
                      {
                        path: ROTAS.formatura,
                        handle: { titulo: 'Dados da formatura' },
                        lazy: pagina(() => import('./PaginaDaFormatura')),
                      },
                      // Todo membro tem o próprio cadastro — inclusive a comissão, que também se forma.
                      {
                        path: ROTAS.meuCadastro,
                        handle: { titulo: 'Meus dados' },
                        // Compõe o cadastro com a troca de senha, que é da conta.
                        lazy: pagina(() => import('./PaginaDoMeuCadastro')),
                      },
                      // Todo membro adere — a comissão também paga a formatura. Compõe adesões e formandos.
                      {
                        path: ROTAS.adesao,
                        handle: { titulo: 'Meu termo' },
                        lazy: pagina(() => import('./PaginaDaAdesao')),
                      },
                      // Todo membro paga — a comissão também se forma. A parcela de outro a API responde 404.
                      {
                        path: ROTAS.extrato,
                        handle: { titulo: 'Minhas parcelas' },
                        lazy: pagina(() => import('@/features/pagamentos/pages/MeuExtratoPage')),
                      },
                      {
                        path: `${ROTAS.extrato}/parcelas/:id/pagar`,
                        handle: { titulo: 'Pagar parcela' },
                        lazy: pagina(() => import('@/features/pagamentos/pages/PagamentoPage')),
                      },
                      // Prestação de contas: todo membro lê, o formando inclusive. São somas e
                      // contratos, sem nome de ninguém — quem paga a turma tem direito de ver no que
                      // ela gasta. Lançar, pagar e cancelar continuam da Tesouraria, na própria API.
                      {
                        path: ROTAS.caixa,
                        handle: { titulo: 'Caixa' },
                        // Compõe financeiro e relatórios: a adimplência e o gasto por fornecedor
                        // vêm do painel da turma.
                        lazy: pagina(() => import('./PaginaDoCaixa')),
                      },
                      {
                        path: ROTAS.despesas,
                        handle: { titulo: 'Despesas' },
                        lazy: pagina(() => import('@/features/financeiro/pages/DespesasPage')),
                      },
                      // Mural e acervo: todo membro lê e baixa. O que é só da comissão a API nem devolve ao
                      // formando; publicar, enviar e excluir são da Gestão, na própria API.
                      {
                        path: ROTAS.mural,
                        handle: { titulo: 'Mural' },
                        lazy: pagina(() => import('@/features/comunicacao/pages/MuralPage')),
                      },
                      // O aviso aberto é o mesmo mural, com ele selecionado na lista: o link de um
                      // aviso continua sendo um link, e não há duas telas desenhando o mesmo texto.
                      {
                        path: `${ROTAS.mural}/:id`,
                        handle: { titulo: 'Mural' },
                        lazy: pagina(() => import('@/features/comunicacao/pages/MuralPage')),
                      },
                      {
                        path: ROTAS.documentos,
                        handle: { titulo: 'Documentos' },
                        lazy: pagina(() => import('@/features/comunicacao/pages/DocumentosPage')),
                      },
                      // A despesa se corrige, paga e cancela na tela dela, como o cadastro do membro.
                      {
                        path: `${ROTAS.despesas}/:id`,
                        handle: { titulo: 'Despesa' },
                        lazy: pagina(() => import('@/features/financeiro/pages/DetalheDaDespesaPage')),
                      },
                      // Gestão (matriz da Sprint 1): Tesoureiro e Comissão veem; o Presidente passa sempre.
                      {
                        element: <ExigePapel papeis={[PAPEIS.tesoureiro, PAPEIS.comissao]} />,
                        children: [
                          {
                            path: ROTAS.membros,
                            handle: { titulo: 'Membros' },
                            lazy: pagina(() => import('@/features/membros/pages/MembrosPage')),
                          },
                          // Gestão lê; corrigir é só do Presidente (a API decide).
                          {
                            path: `${ROTAS.membros}/:usuario_id`,
                            handle: { titulo: 'Cadastro do membro' },
                            lazy: pagina(() => import('@/features/formandos/pages/DetalheDoFormandoPage')),
                          },
                          // Gestão acompanha; publicar o termo é só do Presidente (a API decide).
                          {
                            path: ROTAS.adesoes,
                            handle: { titulo: 'Adesões' },
                            lazy: pagina(() => import('@/features/adesoes/pages/AdesoesPage')),
                          },
                          // Contratar é só do Presidente (a API decide); a assinatura em si mora na página da formatura.
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
                          // Balancete, exportações e a fila de PDFs — é aqui que se fecha a prestação de contas.
                          {
                            path: ROTAS.relatorios,
                            handle: { titulo: 'Relatórios' },
                            lazy: pagina(() => import('@/features/relatorios/pages/RelatoriosPage')),
                          },
                          {
                            path: ROTAS.parcelas,
                            handle: { titulo: 'Parcelas' },
                            // Compõe cobranças e pagamentos: a baixa manual e o estorno abrem na linha da parcela.
                            lazy: pagina(() => import('./PaginaDeParcelas')),
                          },
                          // O que a régua já enviou — é o que a comissão mostra quando alguém diz
                          // que nunca foi avisado. Escrever a régua é da Tesouraria, abaixo.
                          {
                            path: ROTAS.avisosEnviados,
                            handle: { titulo: 'Avisos enviados' },
                            lazy: pagina(() => import('@/features/notificacoes/pages/HistoricoDeAvisosPage')),
                          },
                        ],
                      },
                      // Tesouraria: o Tesoureiro monta o plano; o Presidente passa sempre e é quem o põe em vigor.
                      {
                        element: <ExigePapel papeis={[PAPEIS.tesoureiro]} />,
                        children: [
                          {
                            path: ROTAS.cobrancas,
                            handle: { titulo: 'Plano de cobrança' },
                            lazy: pagina(() => import('@/features/cobrancas/pages/PlanoDeCobrancaPage')),
                          },
                          // A fila dos avisos de pagamento: conferir em lote olhando o extrato do banco.
                          {
                            path: ROTAS.conferencia,
                            handle: { titulo: 'Conferir pagamentos' },
                            lazy: pagina(() => import('@/features/pagamentos/pages/ConferenciaPage')),
                          },
                          // Quem escreve o que a turma recebe é quem responde pelo caixa.
                          {
                            path: ROTAS.regua,
                            handle: { titulo: 'Lembretes automáticos' },
                            lazy: pagina(() => import('@/features/notificacoes/pages/ReguaPage')),
                          },
                          {
                            path: ROTAS.fornecedores,
                            handle: { titulo: 'Fornecedores' },
                            lazy: pagina(() => import('@/features/financeiro/pages/FornecedoresPage')),
                          },
                          {
                            path: `${ROTAS.fornecedores}/:id`,
                            handle: { titulo: 'Fornecedor' },
                            lazy: pagina(() => import('@/features/financeiro/pages/DetalheDoFornecedorPage')),
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
