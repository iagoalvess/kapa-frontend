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
  termosDeUso: '/termos-de-uso',
  privacidade: '/privacidade',
} as const
