import { setupServer } from 'msw/node'

/**
 * Servidor de mocks da suíte.
 *
 * Começa **sem** nenhum handler: cada teste declara as respostas de que precisa com
 * `servidor.use(...)`. Handler global vira contrato implícito que ninguém lembra de atualizar
 * quando a API muda.
 */
export const servidor = setupServer()
