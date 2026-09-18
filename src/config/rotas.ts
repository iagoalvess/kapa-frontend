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
  // A página institucional, pública. Fica na raiz porque é o endereço que a Kapa divulga — e é
  // por isso que o início do app desceu para `/inicio` na Sprint 16.
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
  // "Minhas parcelas" — a rota tem o nome da tela. O e-mail de pagamento confirmado ou recusado
  // aponta aqui (`EmailsDePagamento`).
  extrato: '/minhas-parcelas',
  // A fila de avisos de pagamento e as divergências (Tesouraria).
  conferencia: '/financeiro/conferencia',
  // Quanto a turma tem, quanto entra e quanto sai (Gestão) — é por aqui que se decide contratar.
  caixa: '/financeiro/caixa',
  // O que a turma deve e o que já pagou, e quem ela contrata (Tesouraria).
  despesas: '/financeiro/despesas',
  fornecedores: '/financeiro/fornecedores',
  // Os relatórios do período, o balancete e as exportações (Gestão).
  relatorios: '/relatorios',
  // A régua de cobrança (Tesouraria) e o que ela já enviou (Gestão).
  regua: '/notificacoes/lembretes',
  avisosEnviados: '/notificacoes/enviados',
  // O que a turma está comprando e quanto falta juntar: a Gestão escreve, todo membro lê.
  festa: '/festa',
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
  // Documentos legais: públicos, e com `/:versao` no fim para o link permanente de cada versão.
  termosDeUso: '/termos-de-uso',
  privacidade: '/privacidade',
  aceitePendente: '/aceite-pendente',
  // O portal do titular: ver, exportar, revogar e pedir eliminação. Não se confunde com
  // `privacidade`, que é a Política pública — este é o que a LGPD chama de direitos do titular.
  // O e-mail do portal aponta para cá (`EmailsDePrivacidade`).
  minhaPrivacidade: '/minha-privacidade',
  // Com quem a Kapa compartilha dado pessoal. Público: é lido antes do cadastro.
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

/** Um aviso do mural, inteiro: `/mural/:id`. */
export const rotaDoAviso = (id: string) => `${ROTAS.mural}/${id}`

/** O cadastro de um fornecedor, com o que já saiu para ele: `/financeiro/fornecedores/:id`. */
export const rotaDoFornecedor = (id: string) => `${ROTAS.fornecedores}/${id}`

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
