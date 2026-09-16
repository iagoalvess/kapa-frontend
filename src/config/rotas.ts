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
  inicio: '/',
  selecionarFormatura: '/formaturas/selecionar',
  novaFormatura: '/formaturas/nova',
  // Dados, datas e assinatura. O e-mail de assinatura aponta aqui (`EmailsDeAssinatura`).
  formatura: '/formatura',
  // Lista com acesso e cadastro; o cadastro de um membro é `/formatura/membros/:usuario_id`.
  membros: '/formatura/membros',
  meuCadastro: '/meu-cadastro',
  // O plano de cobrança da turma (Tesouraria); as parcelas que ele gera ficam embaixo (Gestão).
  cobrancas: '/cobrancas',
  parcelas: '/cobrancas/parcelas',
  // O extrato do próprio membro. O e-mail de pagamento confirmado ou recusado aponta aqui (`EmailsDePagamento`).
  extrato: '/extrato',
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
  regua: '/notificacoes/regua',
  avisosEnviados: '/notificacoes/enviados',
  // O mural de avisos e o acervo de documentos: a comissão publica, todo membro lê e baixa.
  mural: '/mural',
  documentos: '/documentos',
  // O termo do próprio formando — ler, aceitar, ver o assinado. O e-mail da adesão aponta aqui (`EmailsDeAdesao`).
  adesao: '/adesao',
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
} as const

/** Uma despesa lançada, onde ela se corrige, paga e cancela: `/financeiro/despesas/:id`. */
export const rotaDaDespesa = (id: string) => `${ROTAS.despesas}/${id}`

/** Um aviso do mural, inteiro: `/mural/:id`. */
export const rotaDoAviso = (id: string) => `${ROTAS.mural}/${id}`

/** O cadastro de um fornecedor, com o que já saiu para ele: `/financeiro/fornecedores/:id`. */
export const rotaDoFornecedor = (id: string) => `${ROTAS.fornecedores}/${id}`

/** O PIX de uma parcela, com o "Já paguei": `/extrato/parcelas/:id/pagar`. */
export const rotaDoPagamento = (parcelaId: string) => `${ROTAS.extrato}/parcelas/${parcelaId}/pagar`

/** Sufixo das rotas de documento legal que abre uma versão específica. */
export const SUFIXO_DE_VERSAO = '/:versao?'
