import { toast } from 'sonner'
import { ehCodigoDeUpgrade, upgrade } from '@/lib/upgrade'

/**
 * Corpo de erro da API, no formato RFC 9457 (ProblemDetails).
 *
 * `codigo` e `traceId` são extensões que o backend sempre envia. Ver `docs/decisoes.md`.
 */
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  codigo?: string
  traceId?: string
  errors?: Record<string, string[]>
  /** O que a tela precisa além do código — o "já validado às 22h14 por Ana" da portaria. */
  dados?: unknown
}

/** Mensagem exibida quando a API responde erro sem corpo legível. */
const MENSAGEM_PADRAO = 'Não foi possível concluir a operação. Tente novamente.'

/**
 * Falha devolvida pela API com status HTTP.
 *
 * Ramifique por {@link codigo} — ele é estável e versionado junto com o backend. Ramificar por
 * `message` amarra o front ao texto que o produto vai querer reescrever na próxima sprint.
 */
export class ErroDaApi extends Error {
  readonly status: number
  readonly codigo: string
  readonly traceId: string | undefined
  /** Erros de validação por campo do payload, como o backend agrupou. */
  readonly erros: Record<string, string[]>
  /** Dados do conflito, quando o 409 é informação e não erro. Estreite antes de usar. */
  readonly dados: unknown
  /**
   * Em quantos segundos tentar de novo, pelo `Retry-After` do 429 — a fila da loja (Sprint 26) diz
   * quando voltar, e quem martela antes só piora a fila. Nulo sem o cabeçalho.
   */
  readonly repetirEm: number | null

  constructor(status: number, problema: ProblemDetails, repetirEm: number | null = null) {
    // Em 400 de validação o título é genérico ("dados inválidos"); o texto útil vem no campo.
    super(
      problema.detail ?? Object.values(problema.errors ?? {})[0]?.[0] ?? problema.title ?? MENSAGEM_PADRAO,
    )
    this.name = 'ErroDaApi'
    this.status = status
    this.codigo = problema.codigo ?? `http.${status}`
    this.traceId = problema.traceId
    this.erros = problema.errors ?? {}
    this.dados = problema.dados ?? null
    this.repetirEm = repetirEm
  }
}

/** Falha antes de haver resposta: rede fora, DNS, CORS ou tempo limite estourado. */
export class ErroDeRede extends Error {
  constructor(mensagem = 'Não foi possível conectar agora. Confira sua conexão e tente novamente.') {
    super(mensagem)
    this.name = 'ErroDeRede'
  }
}

/** Diz se o erro veio da API com status HTTP. */
export function ehErroDaApi(erro: unknown): erro is ErroDaApi {
  return erro instanceof ErroDaApi
}

/**
 * Extrai a mensagem para exibição a partir de qualquer falha.
 *
 * @param erro Erro capturado.
 */
export function mensagemDoErro(erro: unknown): string {
  if (erro instanceof ErroDaApi || erro instanceof ErroDeRede) return erro.message
  return MENSAGEM_PADRAO
}

/**
 * Abre o diálogo de upgrade quando a falha é do plano da turma (Sprint 45).
 *
 * "Esta área não está no plano" e "a turma chegou ao limite" não são erro de quem clicou: são o momento
 * de contratar, e o toast vermelho dizia só que algo deu errado.
 *
 * @param erro Erro capturado.
 * @returns `true` se era falha de plano e o diálogo abriu — quem chama então não mostra mais nada.
 */
export function pedirUpgradeSeForDoPlano(erro: unknown): boolean {
  if (!ehErroDaApi(erro) || !ehCodigoDeUpgrade(erro.codigo)) return false

  upgrade.pedir({ codigo: erro.codigo, mensagem: erro.message })
  return true
}

/**
 * Avisa a falha num toast de erro, com a mensagem de {@link mensagemDoErro}. Falha de plano abre o
 * diálogo de upgrade no lugar ({@link pedirUpgradeSeForDoPlano}).
 *
 * É o `onError` de toda mutação de ação que não tem formulário para mostrar o erro no lugar:
 * `mutate(dados, { onError: avisarErro })`.
 *
 * @param erro Erro capturado.
 */
export function avisarErro(erro: unknown) {
  if (pedirUpgradeSeForDoPlano(erro)) return

  toast.error(mensagemDoErro(erro))
}
