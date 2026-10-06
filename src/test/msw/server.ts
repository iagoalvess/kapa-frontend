import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

/**
 * Servidor de mocks da suíte.
 *
 * Começa **sem** nenhum handler: cada teste declara as respostas de que precisa com
 * `servidor.use(...)`. Handler global vira contrato implícito que ninguém lembra de atualizar
 * quando a API muda.
 *
 * A exceção é o aviso de paywall exibido: é analytics sem resposta que alguém leia, e sem ele todo teste
 * que mostra uma área trancada teria de declarar uma rota que não é o que ele testa.
 */
export const servidor = setupServer(
  http.post('*/api/v1/formaturas/atual/plano/paywall/:motivo', () => new HttpResponse(null, { status: 204 })),
)
