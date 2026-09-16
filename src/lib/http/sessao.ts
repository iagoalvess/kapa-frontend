import { env } from '@/config/env'
import { lerAccessToken, type UsuarioAutenticado } from './jwt'

/**
 * Resposta de `/auth/login` e `/auth/refresh`.
 *
 * Não há `refreshToken` aqui: ele viaja em cookie `HttpOnly`, fora do alcance deste código.
 * Ver `docs/decisoes.md`, item 1.
 */
export interface ParDeTokens {
  access_token: string
  expira_em: string
}

/** Estado observável da sessão. */
export interface EstadoDaSessao {
  readonly usuario: UsuarioAutenticado | null
  readonly autenticado: boolean
}

const VAZIO: EstadoDaSessao = { usuario: null, autenticado: false }

let estado: EstadoDaSessao = VAZIO
let accessToken: string | null = null
let renovacaoEmCurso: Promise<string | null> | null = null

const ouvintes = new Set<() => void>()

function publicar(novo: EstadoDaSessao) {
  estado = novo
  for (const ouvinte of ouvintes) ouvinte()
}

/**
 * Dono dos tokens da aplicação.
 *
 * Nenhum dos dois é persistido por este código. O access token fica **em memória** e some no F5;
 * o refresh token é um cookie `HttpOnly` que só o navegador manipula — este módulo nunca o lê,
 * grava ou apaga, e é justamente isso que tira a credencial de longa duração do alcance de um
 * XSS.
 *
 * A consequência prática: não dá para saber se existe sessão sem perguntar ao servidor. É o que
 * `restaurar` faz na abertura da aplicação.
 */
export const sessao = {
  /** Estado atual. Referência estável entre mudanças — serve para `useSyncExternalStore`. */
  estado: () => estado,

  /** Registra um ouvinte de mudança e devolve a função que o remove. */
  inscrever(ouvinte: () => void) {
    ouvintes.add(ouvinte)
    return () => {
      ouvintes.delete(ouvinte)
    }
  },

  /** Access token atual, ou `null` se não houver sessão. */
  accessToken: () => accessToken,

  /** Aceita o par recém-emitido e passa a considerar o usuário autenticado. */
  autenticar(par: ParDeTokens) {
    accessToken = par.access_token

    const usuario = lerAccessToken(par.access_token)
    publicar({ usuario, autenticado: usuario !== null })
  },

  /**
   * Descarta o estado local.
   *
   * Não apaga o cookie — ele é `HttpOnly` e só o servidor consegue, no `/auth/logout`. Quem faz
   * logout de verdade é a feature de autenticação.
   */
  encerrar() {
    accessToken = null
    renovacaoEmCurso = null
    publicar(VAZIO)
  },

  /**
   * Troca o cookie de sessão por um access token novo.
   *
   * Chamadas concorrentes compartilham a mesma requisição: com cinco consultas recebendo 401 ao
   * mesmo tempo, cinco renovações paralelas rodariam a rotação do backend cinco vezes — e a
   * detecção de reúso derrubaria a sessão do usuário.
   *
   * Usa `fetch` cru de propósito: passar pelo cliente HTTP criaria recursão no 401.
   * `credentials: 'include'` é o que faz o cookie acompanhar a requisição entre origens.
   *
   * @returns O novo access token, ou `null` se a renovação falhou.
   */
  renovar(): Promise<string | null> {
    renovacaoEmCurso ??= (async () => {
      try {
        const resposta = await fetch(`${env.VITE_API_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        })

        if (!resposta.ok) {
          sessao.encerrar()
          return null
        }

        const par = (await resposta.json()) as ParDeTokens
        sessao.autenticar(par)
        return par.access_token
      } catch {
        // Falha de rede não invalida a sessão: o próximo pedido tenta de novo.
        return null
      } finally {
        renovacaoEmCurso = null
      }
    })()

    return renovacaoEmCurso
  },

  /**
   * Recupera a sessão na abertura da aplicação.
   *
   * Chamada uma vez em `main.tsx`, antes do primeiro render — sem isso, a guarda de rota veria
   * "não autenticado" e mandaria para o login quem tem cookie de sessão válido.
   *
   * Tenta sempre, porque o cookie é invisível para o JavaScript: não há como consultar
   * localmente se vale a pena. O custo é uma requisição na carga da página; um 401 devolve o
   * estado vazio, que é o correto para quem não tem sessão.
   */
  async restaurar() {
    await sessao.renovar()
  },
}
