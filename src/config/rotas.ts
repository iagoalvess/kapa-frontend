import { env } from './env'

/**
 * Caminhos da aplicação em um lugar só.
 *
 * Rota escrita à mão em `<Link to="/usarios">` não quebra o build — vira 404 em produção.
 * Aqui, o erro de digitação não compila.
 */
export const ROTAS = {
  login: '/login',
  criarConta: '/criar-conta',
  esqueciSenha: '/esqueci-senha',
  // Estes dois chegam por link de e-mail: o backend monta a URL com eles (`Conta:Caminho*`).
  redefinirSenha: '/redefinir-senha',
  confirmarEmail: '/confirmar-email',
  // A página institucional, na raiz do site (`kapaformaturas.com.br`, Sprint 33). No app, `/` só
  // redireciona para o Início, que mora em `/inicio` desde a Sprint 16.
  landing: '/',
  inicio: '/inicio',
  selecionarFormatura: '/formaturas/selecionar',
  novaFormatura: '/formaturas/nova',
  // Dados, datas e assinatura. O e-mail de assinatura aponta aqui (`EmailsDeAssinatura`).
  formatura: '/formatura',
  // Lista com acesso e cadastro; o cadastro de um membro é `/formatura/membros/:usuario_id`.
  membros: '/formatura/membros',
  // O nome da rota é o nome da tela: "Meus dados", como o menu do avatar a chama.
  meuCadastro: '/meus-dados',
  // O plano de cobrança da turma (Tesouraria); as parcelas que ele gera ficam embaixo (Gestão).
  cobrancas: '/cobrancas',
  parcelas: '/cobrancas/parcelas',
  // Quem pediu o quê dos opcionais (Gestão). Os opcionais em si ficam na tela de Plano: um
  // opcional é um item de cobrança, e dois itens de menu para a mesma tabela confundem quem cadastra.
  pedidos: '/cobrancas/pedidos',
  // A conta aberta de cada item — porta de Pedidos, como Adesões é de Membros.
  pedidosPorItem: '/cobrancas/pedidos/itens',
  // As compras da loja pública (Gestão, Sprint 26): a lista da devolução e o que está preso esperando.
  comprasDaLoja: '/cobrancas/loja',
  // A loja pública da turma, sem login, com o id da turma no fim (`/loja/:formaturaId`). O backend
  // monta o link com ela (`RotasDoFront.Loja`).
  loja: '/loja',
  // A compra da loja pelo link de acesso, com o token no fim (`/compra/:token`) — o e-mail da compra
  // aponta aqui (`RotasDoFront.Compra`).
  compra: '/compra',
  // "Minhas parcelas" — a rota tem o nome da tela. O e-mail de pagamento confirmado ou recusado
  // aponta aqui (`EmailsDePagamento`).
  extrato: '/minhas-parcelas',
  // O recibo de uma baixa (Sprint 22). É para onde o e-mail de pagamento confirmado aponta.
  recibos: '/recibos',
  // "Meus pedidos": o que a pessoa pediu dos opcionais e o que ainda pode pedir. O par de `pedidos`.
  meusPedidos: '/meus-pedidos',
  // "Meus convites": os convites da festa que a pessoa comprou, com o nome de cada convidado.
  meusConvites: '/meus-convites',
  // A fila de avisos de pagamento e as divergências (Tesouraria).
  conferencia: '/financeiro/conferencia',
  // Quanto a turma tem, quanto entra e quanto sai (Gestão) — é por aqui que se decide contratar.
  caixa: '/financeiro/caixa',
  // O que a turma deve e o que já pagou, e quem ela contrata (Tesouraria).
  despesas: '/financeiro/despesas',
  // O que entra sem ser parcela de formando: patrocínio, evento, doação, rendimento (Sprint 28).
  outrasReceitas: '/financeiro/outras-receitas',
  fornecedores: '/financeiro/fornecedores',
  // Os relatórios do período, o balancete e as exportações (Gestão).
  relatorios: '/relatorios',
  // A régua de cobrança (Tesouraria) e o que ela já enviou (Gestão).
  regua: '/notificacoes/lembretes',
  avisosEnviados: '/notificacoes/enviados',
  // Todas as datas da turma — colação, festa, reunião, prazo: a Gestão escreve, todo membro lê.
  agenda: '/agenda',
  // O que a turma está comprando e quanto falta juntar: a Gestão escreve, todo membro lê.
  festa: '/festa',
  // A porta da festa: a lista, a busca por código e a validação (Gestão, Sprint 21).
  portaria: '/festa/portaria',
  // As mesas do jantar: nome, lugares e de quem é a mesa vendida (Gestão, Sprint 27).
  mesas: '/festa/mesas',
  // O mural de avisos e o acervo de documentos: a comissão publica, todo membro lê e baixa.
  mural: '/mural',
  documentos: '/documentos',
  // "Meu termo": ler, aceitar e ver o assinado. O e-mail da adesão aponta aqui (`EmailsDeAdesao`).
  adesao: '/meu-termo',
  // Quem aderiu e quem falta, e o termo da turma (Gestão; o Presidente publica).
  adesoes: '/adesoes',
  planos: '/assinatura/planos',
  // O provedor devolve o navegador aqui: o backend monta a URL com ele (`Assinaturas:CaminhoDeRetorno`).
  retornoDoCheckout: '/assinatura/retorno',
  // Aceite de convite, com o token no fim (`/convite/:token`). O backend monta o link com ele.
  convite: '/convite',
  // O convite da festa, público, com o token no fim (`/ingresso/:token`). Não é `/convite`, que é o
  // de entrar na turma: o choque de nomes que a decisão 2 da Sprint 21 resolveu. O QR e o e-mail
  // apontam aqui (`RotasDoFront.Ingresso`).
  ingresso: '/ingresso',
  // Documentos legais: públicos, e com `/:versao` no fim para o link permanente de cada versão.
  // Moram no site, não no app (P3 da Sprint 33): o app aponta para eles com `urlDoSite`.
  termosDeUso: '/termos-de-uso',
  privacidade: '/privacidade',
  aceitePendente: '/aceite-pendente',
  // O portal do titular: ver, exportar, revogar e pedir eliminação. Não se confunde com
  // `privacidade`, que é a Política pública — este é o que a LGPD chama de direitos do titular.
  // O e-mail do portal aponta para cá (`EmailsDePrivacidade`).
  minhaPrivacidade: '/minha-privacidade',
  // Com quem a Kapa compartilha dado pessoal. Público, lido antes do cadastro — e no site, como os legais.
  operadores: '/operadores',
  // Quem fez o quê com o dinheiro da turma (Gestão).
  auditoria: '/auditoria',
  // O painel de suporte: perfil `Administrador` da plataforma, fora de qualquer formatura.
  suporte: '/suporte',
} as const

/** A turma no painel de suporte: `/suporte/formaturas/:id`. */
export const rotaDaTurmaNoSuporte = (id: string) => `${ROTAS.suporte}/formaturas/${id}`

/** A conta no painel de suporte: `/suporte/usuarios/:id`. */
export const rotaDaContaNoSuporte = (id: string) => `${ROTAS.suporte}/usuarios/${id}`

/** O cadastro de um membro da turma: `/formatura/membros/:usuario_id`. */
export const rotaDoMembro = (usuarioId: string) => `${ROTAS.membros}/${usuarioId}`

/** Uma despesa lançada, onde ela se corrige, paga e cancela: `/financeiro/despesas/:id`. */
export const rotaDaDespesa = (id: string) => `${ROTAS.despesas}/${id}`

/** Um item da festa, aberto na tela: `/festa/:id`. */
export const rotaDoItemDaFesta = (id: string) => `${ROTAS.festa}/${id}`

/** O convite da festa, público: `/ingresso/:token`. É a URL que vai no QR (decisão 3). */
export const rotaDoIngresso = (token: string) => `${ROTAS.ingresso}/${token}`

/** A loja pública da turma: `/loja/:formaturaId`. É o link que a comissão divulga. */
export const rotaDaLoja = (formaturaId: string) => `${ROTAS.loja}/${formaturaId}`

/** A compra pelo link de acesso: `/compra/:token`. */
export const rotaDaCompra = (token: string) => `${ROTAS.compra}/${token}`

/** Um aviso do mural, inteiro: `/mural/:id`. */
export const rotaDoAviso = (id: string) => `${ROTAS.mural}/${id}`

/** O cadastro de um fornecedor, com o que já saiu para ele: `/financeiro/fornecedores/:id`. */
export const rotaDoFornecedor = (id: string) => `${ROTAS.fornecedores}/${id}`

/** O recibo de uma baixa: `/recibos/:id` — o mesmo caminho de `RotasDoFront.Recibo` no backend. */
export const rotaDoRecibo = (recebimentoId: string) => `${ROTAS.recibos}/${recebimentoId}`

/** O PIX de uma parcela, com o "Já paguei": `/minhas-parcelas/parcelas/:id/pagar`. */
export const rotaDoPagamento = (parcelaId: string) => `${ROTAS.extrato}/parcelas/${parcelaId}/pagar`

/**
 * O PIX de várias parcelas de uma vez: `/minhas-parcelas/pagar?parcelas=id,id`.
 *
 * As parcelas vão na query, e não na rota: é uma escolha da tela anterior, e uma URL com a lista
 * dentro se recarrega, se volta e se compartilha entre as abas do mesmo navegador.
 */
export const rotaDoPagamentoEmLote = (parcelaIds: string[]) =>
  `${ROTAS.extrato}/pagar?parcelas=${parcelaIds.join(',')}`

/** Sufixo das rotas de documento legal que abre uma versão específica. */
export const SUFIXO_DE_VERSAO = '/:versao?'

/**
 * As páginas que moram no site (`kapaformaturas.com.br`), e não no app: a institucional e os
 * documentos legais (P3 da Sprint 33). Todo o resto de {@link ROTAS} é do app — e é o que o site
 * redireciona para o `app.` (P5).
 */
export const ROTAS_DO_SITE: readonly string[] = [
  ROTAS.landing,
  ROTAS.termosDeUso,
  ROTAS.privacidade,
  ROTAS.operadores,
]

/** Uma tela do app em endereço absoluto: o "Entrar" e o "Criar minha turma" do site. */
export const urlDoApp = (caminho: string) => `${env.VITE_APP_URL}${caminho}`

/** Uma página do site em endereço absoluto: os documentos legais, abertos a partir do app. */
export const urlDoSite = (caminho: string) => `${env.VITE_SITE_URL}${caminho}`
