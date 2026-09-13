import { env } from '@/config/env'
import { ErroDaApi, ErroDeRede, type ProblemDetails } from './erros'
import { sessao } from './sessao'

/** Valores aceitos na query string. `undefined` e `null` são omitidos. */
type ValorDeQuery = string | number | boolean | undefined | null

/** Opções de uma chamada à API. */
export interface OpcoesDaRequisicao extends Omit<RequestInit, 'body' | 'method' | 'signal'> {
  /** Corpo em JSON, serializado automaticamente — ou `FormData`, que vai como multipart. */
  body?: unknown
  /** `blob` para conteúdo binário (a foto); o padrão é JSON. */
  resposta?: 'json' | 'blob'
  /** Parâmetros da query string. */
  query?: Record<string, ValorDeQuery>
  /** `false` em endpoint público — evita mandar um token expirado e provocar renovação à toa. */
  autenticar?: boolean
  /** Tempo limite em milissegundos. */
  tempoLimite?: number
  /** Cancelamento do chamador. O React Query passa o dele automaticamente. */
  signal?: AbortSignal
}

const TEMPO_LIMITE_PADRAO = 30_000

async function lerProblema(resposta: Response): Promise<ProblemDetails> {
  try {
    return (await resposta.json()) as ProblemDetails
  } catch {
    return { status: resposta.status }
  }
}

async function requisitar<T>(metodo: string, caminho: string, opcoes: OpcoesDaRequisicao = {}): Promise<T> {
  const {
    body,
    resposta: formato = 'json',
    query,
    autenticar = true,
    tempoLimite = TEMPO_LIMITE_PADRAO,
    headers,
    signal,
    ...resto
  } = opcoes

  // Multipart sai como veio: o navegador monta o `Content-Type` com a fronteira, e escrever o
  // cabeçalho à mão (ou serializar em JSON) quebraria o envio.
  const multipart = body instanceof FormData

  const url = new URL(`${env.VITE_API_URL}${caminho}`)
  for (const [chave, valor] of Object.entries(query ?? {})) {
    if (valor !== undefined && valor !== null) url.searchParams.set(chave, String(valor))
  }

  const executar = async (token: string | null) => {
    const cabecalhos = new Headers(headers)
    cabecalhos.set('Accept', formato === 'blob' ? '*/*' : 'application/json')
    if (body !== undefined && !multipart) cabecalhos.set('Content-Type', 'application/json')
    if (token) cabecalhos.set('Authorization', `Bearer ${token}`)

    const sinais = [AbortSignal.timeout(tempoLimite)]
    if (signal) sinais.push(signal)

    try {
      return await fetch(url, {
        ...resto,
        method: metodo,
        headers: cabecalhos,
        // O cookie de sessão é `HttpOnly` e a API costuma ficar em outra origem: sem isto o
        // navegador não o envia, e `/auth/refresh` e `/auth/logout` respondem 401 sem pista.
        credentials: 'include',
        signal: AbortSignal.any(sinais),
        ...(body === undefined ? {} : { body: multipart ? body : JSON.stringify(body) }),
      })
    } catch (erro) {
      // Cancelamento pedido pelo chamador não é falha: propague para o React Query entender.
      if (signal?.aborted) throw erro
      if (erro instanceof DOMException && erro.name === 'TimeoutError') {
        throw new ErroDeRede('O servidor demorou para responder. Tente novamente.')
      }
      throw new ErroDeRede()
    }
  }

  let resposta = await executar(autenticar ? sessao.accessToken() : null)

  // Access token vencido: renova uma vez e repete. Uma só — se o segundo 401 vier, o problema
  // não é o token, e insistir vira laço infinito contra a API.
  if (resposta.status === 401 && autenticar) {
    const novoToken = await sessao.renovar()
    if (novoToken) resposta = await executar(novoToken)
    else sessao.encerrar()
  }

  if (!resposta.ok) throw new ErroDaApi(resposta.status, await lerProblema(resposta))

  if (resposta.status === 204 || resposta.headers.get('Content-Length') === '0') {
    return undefined as T
  }

  return (formato === 'blob' ? await resposta.blob() : await resposta.json()) as T
}

/**
 * Cliente HTTP da aplicação.
 *
 * Cuida de base URL, JSON, `Authorization`, renovação de token, tempo limite e conversão de
 * `ProblemDetails` em {@link ErroDaApi}. Nenhuma feature chama `fetch` direto.
 */
export const api = {
  get: <T>(caminho: string, opcoes?: OpcoesDaRequisicao) => requisitar<T>('GET', caminho, opcoes),
  post: <T>(caminho: string, opcoes?: OpcoesDaRequisicao) => requisitar<T>('POST', caminho, opcoes),
  put: <T>(caminho: string, opcoes?: OpcoesDaRequisicao) => requisitar<T>('PUT', caminho, opcoes),
  patch: <T>(caminho: string, opcoes?: OpcoesDaRequisicao) => requisitar<T>('PATCH', caminho, opcoes),
  delete: <T>(caminho: string, opcoes?: OpcoesDaRequisicao) => requisitar<T>('DELETE', caminho, opcoes),
}
