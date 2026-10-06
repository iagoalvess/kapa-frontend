import { Navigate, Outlet, ScrollRestoration, createBrowserRouter, useParams } from 'react-router'
import { PAPEIS, PERFIS } from '@/config/perfis'
import { MODULOS } from '@/config/planos'
import { ROTAS, rotaDaContaNoPainel, rotaDaTurmaNoPainel, rotaDoMapaDeMesas } from '@/config/rotas'
import { ExigeAceites } from './guards/ExigeAceites'
import { ExigeAdesao } from './guards/ExigeAdesao'
import { ExigeAutenticacao } from './guards/ExigeAutenticacao'
import { ExigeFormatura } from './guards/ExigeFormatura'
import { ExigeModulo } from './guards/ExigeModulo'
import { ExigePapel } from './guards/ExigePapel'
import { ExigePerfil } from './guards/ExigePerfil'
import { SomenteVisitante } from './guards/SomenteVisitante'
import { LayoutApp } from './layouts/LayoutApp'
import { LayoutDeOnboarding } from './layouts/LayoutDeOnboarding'
import { PaginaDeErro } from './PaginaDeErro'
import { PaginaInicial } from './PaginaInicial'
import { PaginaNaoEncontrada } from '@/components/layout/PaginaNaoEncontrada'

/**
 * Carrega uma página sob demanda.
 *
 * Cada `lazy` vira um arquivo separado no build: abrir o login não baixa o resto da aplicação.
 * As páginas de feature usam `export default` justamente para caber nesta única linha.
 */
const pagina = (importar: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await importar()).default,
})

/** Leva um endereço antigo com `:id` ao novo, com o mesmo id. */
function RedirecionarComId({ para }: { para: (id: string) => string }) {
  const { id = '' } = useParams()

  return <Navigate to={para(id)} replace />
}

export const router = createBrowserRouter([
  {
    /*
      Rolagem como num site de páginas: navegar para outra tela começa do topo, e voltar/avançar
      devolve a posição em que a pessoa estava. Sem isto, o SPA trocava o conteúdo e a janela ficava
      rolada lá embaixo. Filtro, busca e paginação não contam como tela nova — `useFiltrosDaUrl`
      grava com `preventScrollReset`.
    */
    element: (
      <>
        <ScrollRestoration />
        <Outlet />
      </>
    ),
    errorElement: <PaginaDeErro />,
    children: [
      // As portas de entrada: com sessão aberta elas não têm o que fazer e mandam para o Início.
      {
        element: <SomenteVisitante />,
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
        ],
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
      // O "Não quero mais receber" do e-mail de marketing (Sprint 40): pedir login para sair é o que
      // manda a pessoa para o botão de spam.
      {
        path: ROTAS.descadastro,
        lazy: pagina(() => import('@/features/privacidade/pages/DescadastroPage')),
      },
      // Público: o convite chega por WhatsApp a quem ainda não tem conta. Com sessão, aceita sozinho.
      {
        path: `${ROTAS.convite}/:token`,
        lazy: pagina(() => import('@/features/convites/pages/ConvitePage')),
      },
      // Público: o convite da festa, aberto no celular do convidado — que não tem conta e nunca vai
      // ter (Sprint 21, decisão 11). Com a Gestão logada, a mesma página vira a portaria.
      {
        path: `${ROTAS.ingresso}/:token`,
        lazy: pagina(() => import('@/features/festa/pages/ConvitePublicoPage')),
      },
      // Públicas: a loja da turma e a compra pelo link — quem compra não tem conta (Sprint 26, decisão 10).
      {
        path: `${ROTAS.loja}/:formaturaId`,
        lazy: pagina(() => import('@/features/loja/pages/LojaPage')),
      },
      // O reenvio do link, pela loja: quem comprou e perdeu o acesso pede outro pelo e-mail (decisão 10).
      {
        path: `${ROTAS.loja}/:formaturaId/reenviar`,
        lazy: pagina(() => import('@/features/loja/pages/ReenvioDoLinkPage')),
      },
      {
        path: `${ROTAS.compra}/:token`,
        lazy: pagina(() => import('@/features/loja/pages/CompraPage')),
      },
      // A página institucional e os documentos legais moram no site (`src/site`, Sprint 33), não
      // aqui. A raiz do app só leva ao Início — e a guarda de lá, ao login de quem não tem sessão.
      { index: true, element: <Navigate to={ROTAS.inicio} replace /> },
      {
        Component: ExigeAutenticacao,
        children: [
          // Fora de `ExigeAceites`, senão a guarda mandaria para cá quem já está aqui. Na moldura do
          // onboarding, e não no app: sem aceite não há app para mostrar, e o "Sair" vem junto.
          {
            Component: LayoutDeOnboarding,
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
                  // **Fora de `ExigeFormatura`**, e é a única tela do app que fica: o portal LGPD é
                  // do titular, não da turma. Quem está em duas formaturas, quem não está em
                  // nenhuma e quem foi desligado têm o mesmo direito de acesso — e mandá-los
                  // escolher uma turma antes seria condicionar um direito a uma escolha que não
                  // tem nada a ver com ele. A API dele pede só sessão, pelo mesmo motivo.
                  {
                    path: ROTAS.minhaPrivacidade,
                    handle: { titulo: 'Privacidade' },
                    lazy: pagina(() => import('@/features/privacidade/pages/MinhaPrivacidadePage')),
                  },
                  // O painel do Kapa (Sprint 44), também fora de `ExigeFormatura`: quem é da Kapa tem
                  // perfil de plataforma e não é membro de turma nenhuma — exigir uma formatura
                  // selecionada trancaria o painel para a única pessoa que precisa dele. O menu é o do
                  // painel (`BarraLateral`), e o das turmas não aparece (D4).
                  {
                    element: <ExigePerfil perfil={PERFIS.administrador} />,
                    children: [
                      { path: ROTAS.painel, element: <Navigate to={ROTAS.painelVisaoGeral} replace /> },
                      {
                        path: ROTAS.painelVisaoGeral,
                        handle: { titulo: 'Visão geral' },
                        lazy: pagina(() => import('@/features/painel/pages/VisaoGeralPage')),
                      },
                      {
                        path: ROTAS.painelTurmas,
                        handle: { titulo: 'Turmas' },
                        lazy: pagina(() => import('@/features/painel/pages/TurmasDoPainelPage')),
                      },
                      {
                        path: `${ROTAS.painelTurmas}/:id`,
                        handle: { titulo: 'Turma' },
                        lazy: pagina(() => import('@/features/painel/pages/TurmaNoPainelPage')),
                      },
                      {
                        path: ROTAS.painelContas,
                        handle: { titulo: 'Contas' },
                        lazy: pagina(() => import('@/features/painel/pages/ContasDoPainelPage')),
                      },
                      {
                        path: `${ROTAS.painelContas}/:id`,
                        handle: { titulo: 'Conta' },
                        lazy: pagina(() => import('@/features/painel/pages/ContaNoPainelPage')),
                      },
                      // Os endereços do painel até a Sprint 44 — favorito e link antigo não morrem.
                      { path: ROTAS.suporteAntigo, element: <Navigate to={ROTAS.painelTurmas} replace /> },
                      {
                        path: `${ROTAS.suporteAntigo}/formaturas/:id`,
                        element: <RedirecionarComId para={rotaDaTurmaNoPainel} />,
                      },
                      {
                        path: `${ROTAS.suporteAntigo}/usuarios/:id`,
                        element: <RedirecionarComId para={rotaDaContaNoPainel} />,
                      },
                    ],
                  },
                  {
                    Component: ExigeFormatura,
                    children: [
                      // O formando que ainda não aderiu só passa pelo termo, pelo cadastro e pelo extrato (Sprint 47, D18).
                      {
                        Component: ExigeAdesao,
                        children: [
                          // `handle.titulo` é o título que o `LayoutApp` mostra no topo da tela.
                          // Caminho explícito, e não `index`: o início do app mora em `/inicio` desde a
                          // Sprint 16, e é esse o `start_url` do app instalado e o destino dos links.
                          { path: ROTAS.inicio, handle: { titulo: 'Início' }, Component: PaginaInicial },
                          // Todo membro lê; o formulário é do Presidente, e a assinatura é da Gestão.
                          {
                            path: ROTAS.formatura,
                            handle: { titulo: 'Dados da formatura' },
                            lazy: pagina(() => import('./PaginaDaFormatura')),
                          },
                          // O destino do link de confirmação por e-mail (revisão de segurança de 05/10/2026).
                          {
                            path: `${ROTAS.confirmar}/:tipo`,
                            handle: { titulo: 'Confirmação' },
                            lazy: pagina(() => import('./PaginaDeConfirmacao')),
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
                          // Todo membro pede — a comissão também compra a foto. Compõe cobranças e
                          // pagamentos: é daqui que "Pedir e pagar" e "Pagar" caem no PIX.
                          {
                            path: ROTAS.meusPedidos,
                            handle: { titulo: 'Meus pedidos' },
                            lazy: pagina(() => import('./PaginaDosMeusPedidos')),
                          },
                          // Todo membro compra convite — a comissão também leva a família. Um convite por convidado.
                          {
                            element: <ExigeModulo modulo={MODULOS.festa} />,
                            children: [
                              {
                                path: ROTAS.meusConvites,
                                handle: { titulo: 'Meus convites' },
                                lazy: pagina(() => import('@/features/festa/pages/MeusConvitesPage')),
                              },
                            ],
                          },
                          {
                            path: `${ROTAS.extrato}/parcelas/:id/pagar`,
                            handle: { titulo: 'Pagar parcela' },
                            lazy: pagina(() => import('@/features/pagamentos/pages/PagamentoPage')),
                          },
                          // O recibo de uma baixa — do próprio formando ou, pela gestão, de qualquer um. É o
                          // destino do e-mail de pagamento confirmado (Sprint 22).
                          {
                            path: `${ROTAS.recibos}/:id`,
                            handle: { titulo: 'Recibo' },
                            lazy: pagina(() => import('@/features/pagamentos/pages/ReciboPage')),
                          },
                          // O mesmo caminho, para o PIX que cobre vários meses: um QR com a soma.
                          {
                            path: `${ROTAS.extrato}/pagar`,
                            handle: { titulo: 'Pagar parcelas' },
                            lazy: pagina(() => import('@/features/pagamentos/pages/PagamentoEmLotePage')),
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
                          {
                            path: ROTAS.outrasReceitas,
                            handle: { titulo: 'Outras receitas' },
                            lazy: pagina(() => import('@/features/financeiro/pages/OutrasReceitasPage')),
                          },
                          // As datas da turma: todo membro lê, a Gestão escreve. A colação e a festa
                          // moram aqui desde a Sprint 19 — o cadastro da turma não as guarda mais.
                          {
                            path: ROTAS.agenda,
                            handle: { titulo: 'Agenda' },
                            lazy: pagina(() => import('@/features/agenda/pages/AgendaPage')),
                          },
                          // Orçamento da festa, mural e acervo: o módulo `mural`, que o gratuito e o
                          // Essencial não têm — a rota abre a vitrine da área em vez do 403 (Sprint 45).
                          {
                            element: <ExigeModulo modulo={MODULOS.mural} />,
                            children: [
                              // O que a turma está comprando: todo membro lê, a Gestão escreve. A API recusa a
                              // escrita do formando, e o cartão nem oferece as ações a ele.
                              {
                                path: ROTAS.festa,
                                handle: { titulo: 'Festa' },
                                lazy: pagina(() => import('@/features/festa/pages/FestaPage')),
                              },
                              // O item aberto é a mesma tela, com ele escolhido na lista — como o mural. A
                              // rota é a seleção: o link de um item continua sendo um link.
                              {
                                path: `${ROTAS.festa}/:id`,
                                handle: { titulo: 'Festa' },
                                lazy: pagina(() => import('@/features/festa/pages/FestaPage')),
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
                            ],
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
                              // As mesas do jantar: a comissão monta o mapa (P1 da Sprint 27). Módulo próprio, só do
                              // Premium (29/09/2026).
                              {
                                element: <ExigeModulo modulo={MODULOS.mesas} />,
                                children: [
                                  {
                                    path: ROTAS.mesas,
                                    handle: { titulo: 'Mesas' },
                                    lazy: pagina(() => import('@/features/festa/pages/MesasPage')),
                                  },
                                  // O editor do salão precisa de largura para arrastar: página própria,
                                  // aberta pelo card lateral da lista (ver docs/menu-e-planos.md).
                                  {
                                    path: rotaDoMapaDeMesas,
                                    handle: { titulo: 'Mapa do salão' },
                                    lazy: pagina(() => import('@/features/festa/pages/MapaDasMesasPage')),
                                  },
                                ],
                              },
                              // A festa em si — portaria e loja — é o módulo `festa` (Sprint 45, P1).
                              {
                                element: <ExigeModulo modulo={MODULOS.festa} />,
                                children: [
                                  // A porta da festa: qualquer membro da Gestão opera (P4 da Sprint 21).
                                  {
                                    path: ROTAS.portaria,
                                    handle: { titulo: 'Portaria' },
                                    lazy: pagina(() => import('@/features/festa/pages/PortariaPage')),
                                  },
                                  // As compras da loja pública (Sprint 26): a lista da devolução é da comissão
                                  // inteira, como os pedidos.
                                  {
                                    path: ROTAS.comprasDaLoja,
                                    handle: { titulo: 'Loja' },
                                    lazy: pagina(() => import('@/features/loja/pages/ComprasDaLojaPage')),
                                  },
                                ],
                              },
                              {
                                path: ROTAS.membros,
                                handle: { titulo: 'Membros' },
                                lazy: pagina(() => import('@/features/membros/pages/MembrosPage')),
                              },
                              // Gestão lê; corrigir é só do Presidente (a API decide).
                              {
                                path: `${ROTAS.membros}/:usuario_id`,
                                handle: { titulo: 'Cadastro do membro' },
                                lazy: pagina(
                                  () => import('@/features/formandos/pages/DetalheDoFormandoPage'),
                                ),
                              },
                              // Gestão acompanha; publicar o termo é só do Presidente (a API decide).
                              {
                                path: ROTAS.adesoes,
                                handle: { titulo: 'Adesões' },
                                lazy: pagina(() => import('@/features/adesoes/pages/AdesoesPage')),
                              },
                              // Contratar é só do Presidente (a API decide); a assinatura em si mora na página da formatura.
                              {
                                // Sem título no cabeçalho: a tela é a vitrine da landing, com o título dela no meio.
                                path: ROTAS.planos,
                                lazy: pagina(() => import('@/features/assinaturas/pages/PlanosPage')),
                              },
                              {
                                path: ROTAS.retornoDoCheckout,
                                handle: { titulo: 'Pagamento' },
                                lazy: pagina(
                                  () => import('@/features/assinaturas/pages/RetornoDoCheckoutPage'),
                                ),
                              },
                              // Balancete, exportações e a fila de PDFs — é aqui que se fecha a prestação de contas.
                              {
                                element: <ExigeModulo modulo={MODULOS.relatorios} />,
                                children: [
                                  {
                                    path: ROTAS.relatorios,
                                    handle: { titulo: 'Relatórios' },
                                    lazy: pagina(() => import('@/features/relatorios/pages/RelatoriosPage')),
                                  },
                                ],
                              },
                              {
                                path: ROTAS.parcelas,
                                handle: { titulo: 'Parcelas' },
                                // Compõe cobranças e pagamentos: a baixa manual e o estorno abrem na linha da parcela.
                                lazy: pagina(() => import('./PaginaDeParcelas')),
                              },
                              // Quem pediu o quê dos opcionais. Toda a Gestão vê: é ela que responde ao
                              // formando que diz "pedi e não apareceu"; cancelar é da Tesouraria, na API.
                              {
                                path: ROTAS.pedidos,
                                handle: { titulo: 'Pedidos' },
                                lazy: pagina(() => import('@/features/cobrancas/pages/PedidosPage')),
                              },
                              {
                                path: ROTAS.pedidosPorItem,
                                handle: { titulo: 'Pedidos por item' },
                                lazy: pagina(() => import('@/features/cobrancas/pages/PedidosPorItemPage')),
                              },
                              // O que a régua já enviou — é o que a comissão mostra quando alguém diz
                              // que nunca foi avisado. Escrever a régua é da Tesouraria, abaixo.
                              {
                                element: <ExigeModulo modulo={MODULOS.avisos} />,
                                children: [
                                  {
                                    path: ROTAS.avisosEnviados,
                                    handle: { titulo: 'Avisos enviados' },
                                    lazy: pagina(
                                      () => import('@/features/notificacoes/pages/HistoricoDeAvisosPage'),
                                    ),
                                  },
                                ],
                              },
                              // Quem fez o quê com o dinheiro da turma. Gestão, e não todo membro: a
                              // trilha nomeia as pessoas, e o que é público é o dashboard, onde tudo é
                              // soma. Só leitura — não há ação nenhuma na tela.
                              {
                                element: <ExigeModulo modulo={MODULOS.auditoria} />,
                                children: [
                                  {
                                    path: ROTAS.auditoria,
                                    handle: { titulo: 'Histórico da turma' },
                                    lazy: pagina(() => import('@/features/auditoria/pages/AuditoriaPage')),
                                  },
                                ],
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
                              {
                                path: ROTAS.lancamentos,
                                handle: { titulo: 'Lançamentos avulsos' },
                                lazy: pagina(() => import('@/features/cobrancas/pages/LancamentosPage')),
                              },
                              // A fila dos avisos de pagamento: conferir em lote olhando o extrato do banco.
                              {
                                path: ROTAS.conferencia,
                                handle: { titulo: 'Conferir pagamentos' },
                                lazy: pagina(() => import('@/features/pagamentos/pages/ConferenciaPage')),
                              },
                              // Quem escreve o que a turma recebe é quem responde pelo caixa.
                              {
                                element: <ExigeModulo modulo={MODULOS.avisos} />,
                                children: [
                                  {
                                    path: ROTAS.regua,
                                    handle: { titulo: 'Lembretes automáticos' },
                                    lazy: pagina(() => import('@/features/notificacoes/pages/ReguaPage')),
                                  },
                                ],
                              },
                              {
                                path: ROTAS.fornecedores,
                                handle: { titulo: 'Fornecedores' },
                                lazy: pagina(() => import('@/features/financeiro/pages/FornecedoresPage')),
                              },
                              {
                                path: `${ROTAS.fornecedores}/:id`,
                                handle: { titulo: 'Fornecedor' },
                                lazy: pagina(
                                  () => import('@/features/financeiro/pages/DetalheDoFornecedorPage'),
                                ),
                              },
                            ],
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
