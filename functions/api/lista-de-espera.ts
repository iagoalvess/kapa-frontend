/**
 * `POST /api/lista-de-espera` — a Pages Function do site (Sprint 36).
 *
 * Confere o Turnstile no servidor, valida os campos com o mesmo schema do formulário e grava no D1.
 * E-mail repetido atualiza a inscrição e responde igual (204): o formulário não revela quem já está
 * na lista. Não guarda IP e não envia e-mail (P5 e P6) — a única chave é o segredo do Turnstile.
 *
 * Mora na raiz do `frontend/`, e por isso o projeto do app também a publica. Lá não há o banco nem o
 * segredo, e ela responde 404: é a trava que impede o app de gravar numa lista que não é dele.
 */
import {
  AVISO_DA_LISTA_DE_ESPERA,
  esquemaDaInscricao,
  soNumeros,
} from '../../src/features/landing/schemas/listaDeEspera.schema.ts'

/** O pedaço do D1 que a Function usa. Sem `@cloudflare/workers-types` por três métodos. */
export interface BancoD1 {
  prepare(sql: string): { bind(...valores: unknown[]): { run(): Promise<unknown> } }
}

export interface Ambiente {
  LISTA_DE_ESPERA?: BancoD1
  TURNSTILE_SECRET?: string
}

const VERIFICACAO_DO_TURNSTILE = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * A inscrição nova ou a repetida. Na repetida vale o que a pessoa acabou de mandar, e a guarda de
 * 12 meses (P8) recomeça do aceite novo; `criado_em` fica o da primeira vez.
 */
const GRAVAR = `
INSERT INTO inscricoes (email, nome, instituicao, curso, semestre_de_formatura, papel, tamanho_da_turma,
  whatsapp, aceito_em, versao_do_aviso, origem, criado_em)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?9)
ON CONFLICT (email) DO UPDATE SET
  nome = excluded.nome,
  instituicao = excluded.instituicao,
  curso = excluded.curso,
  semestre_de_formatura = excluded.semestre_de_formatura,
  papel = excluded.papel,
  tamanho_da_turma = excluded.tamanho_da_turma,
  whatsapp = excluded.whatsapp,
  aceito_em = excluded.aceito_em,
  versao_do_aviso = excluded.versao_do_aviso,
  origem = COALESCE(excluded.origem, inscricoes.origem)`

/** Resposta de erro no formato que o cliente HTTP do front já lê (`ProblemDetails` com `codigo`). */
const problema = (codigo: string, title: string, errors?: Record<string, string[]>) =>
  Response.json({ status: 400, codigo, title, ...(errors ? { errors } : {}) }, { status: 400 })

async function passouNoTurnstile(token: unknown, segredo: string) {
  if (typeof token !== 'string' || token === '') return false
  const resposta = await fetch(VERIFICACAO_DO_TURNSTILE, {
    method: 'POST',
    body: new URLSearchParams({ secret: segredo, response: token }),
  })
  const { success } = (await resposta.json()) as { success?: boolean }
  return success === true
}

export async function onRequestPost({ request, env }: { request: Request; env: Ambiente }) {
  if (!env.LISTA_DE_ESPERA || !env.TURNSTILE_SECRET) return new Response(null, { status: 404 })

  const corpo: unknown = await request.json().catch(() => null)
  if (typeof corpo !== 'object' || corpo === null) return problema('requisicao.invalida', 'Corpo inválido.')

  const { token_do_turnstile: token, origem } = corpo as Record<string, unknown>
  if (!(await passouNoTurnstile(token, env.TURNSTILE_SECRET)))
    return problema(
      'lista_de_espera.verificacao',
      'Não conseguimos confirmar que você não é um robô. Tente de novo.',
    )

  const dados = esquemaDaInscricao.safeParse(corpo)
  if (!dados.success) {
    const erros = Object.fromEntries(
      dados.error.issues.map((falha) => [String(falha.path[0]), [falha.message]]),
    )
    return problema('validacao', 'Confira os campos.', erros)
  }

  const inscricao = dados.data
  await env.LISTA_DE_ESPERA.prepare(GRAVAR)
    .bind(
      inscricao.email,
      inscricao.nome,
      inscricao.instituicao,
      inscricao.curso,
      inscricao.semestre_de_formatura,
      inscricao.papel,
      inscricao.tamanho_da_turma,
      soNumeros(inscricao.whatsapp) || null,
      new Date().toISOString(),
      AVISO_DA_LISTA_DE_ESPERA.versao,
      typeof origem === 'string' && origem !== '' ? origem.slice(0, 300) : null,
    )
    .run()

  return new Response(null, { status: 204 })
}
