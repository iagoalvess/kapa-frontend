import { z } from 'zod'

/**
 * Variáveis de ambiente do bundle, validadas na carga do módulo.
 *
 * Tudo que começa com `VITE_` é embutido no JavaScript entregue ao navegador — não existe
 * segredo aqui. O que este arquivo garante é o oposto: que a aplicação não suba com uma URL
 * de API vazia e só descubra isso na primeira requisição do usuário.
 */
const esquema = z.object({
  VITE_API_URL: z
    .url('VITE_API_URL precisa ser uma URL completa (ex.: http://localhost:8080).')
    .transform((valor) => valor.replace(/\/+$/, '')),
  VITE_APP_NOME: z.string().min(1).default('Frontend'),
})

const resultado = esquema.safeParse(import.meta.env)

if (!resultado.success) {
  throw new Error(`Configuração inválida:\n${z.prettifyError(resultado.error)}`)
}

export const env = resultado.data
