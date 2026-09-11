/**
 * Caminhos da aplicação em um lugar só.
 *
 * Rota escrita à mão em `<Link to="/usarios">` não quebra o build — vira 404 em produção.
 * Aqui, o erro de digitação não compila.
 */
export const ROTAS = {
  login: '/login',
  inicio: '/',
} as const
