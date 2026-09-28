import { z } from 'zod'

/** Endereço de uma das três pontas do Kapa: URL completa, sem barra no final. */
const endereco = (nome: string, exemplo: string) =>
  z
    .url(`${nome} precisa ser uma URL completa (ex.: ${exemplo}).`)
    .transform((valor) => valor.replace(/\/+$/, ''))

/**
 * Variáveis de ambiente do bundle, validadas na carga do módulo.
 *
 * Tudo que começa com `VITE_` é embutido no JavaScript entregue ao navegador — não existe
 * segredo aqui. O que este arquivo garante é o oposto: que a aplicação não suba com uma URL
 * de API vazia e só descubra isso na primeira requisição do usuário.
 *
 * As duas builds leem as três URLs (Sprint 33): o site manda o "Entrar" para o app, e o app manda
 * os documentos legais para o site. Sem padrão de propósito — um padrão de `localhost` numa build
 * de produção vira link quebrado em silêncio.
 */
const esquema = z.object({
  VITE_API_URL: endereco('VITE_API_URL', 'http://localhost:8080'),
  // O sistema: `app.kapaformaturas.com.br`.
  VITE_APP_URL: endereco('VITE_APP_URL', 'http://localhost:5173'),
  // A página institucional e os documentos legais: `kapaformaturas.com.br`.
  VITE_SITE_URL: endereco('VITE_SITE_URL', 'http://localhost:5180'),
  VITE_APP_NOME: z.string().min(1).default('Frontend'),
})

const resultado = esquema.safeParse(import.meta.env)

if (!resultado.success) {
  throw new Error(`Configuração inválida:\n${z.prettifyError(resultado.error)}`)
}

export const env = resultado.data
