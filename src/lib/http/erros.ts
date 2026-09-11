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

  constructor(status: number, problema: ProblemDetails) {
    super(problema.detail ?? problema.title ?? MENSAGEM_PADRAO)
    this.name = 'ErroDaApi'
    this.status = status
    this.codigo = problema.codigo ?? `http.${status}`
    this.traceId = problema.traceId
    this.erros = problema.errors ?? {}
  }
}

/** Falha antes de haver resposta: rede fora, DNS, CORS ou tempo limite estourado. */
export class ErroDeRede extends Error {
  constructor(mensagem = 'Não foi possível falar com o servidor. Verifique sua conexão.') {
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
