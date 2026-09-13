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
  alterarSenha: '/conta/senha',
  inicio: '/',
  selecionarFormatura: '/formaturas/selecionar',
  novaFormatura: '/formaturas/nova',
  dadosDaFormatura: '/formatura/dados',
  membros: '/formatura/membros',
  convites: '/formatura/membros/convites',
  meuCadastro: '/meu-cadastro',
  // Lista da comissão; o detalhe é `/formatura/formandos/:usuarioId`.
  formandos: '/formatura/formandos',
  assinatura: '/assinatura',
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

/** Sufixo das rotas de documento legal que abre uma versão específica. */
export const SUFIXO_DE_VERSAO = '/:versao?'
