import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { sessao } from './sessao'

const REFRESH = `${env.VITE_API_URL}/api/v1/auth/refresh`

/** Monta um access token legível por `lerAccessToken`. */
function token(nome = 'Teste'): string {
  const corpo = { sub: 'u-1', name: nome, email: 'teste@exemplo.com', role: ['Usuario'] }
  const bytes = new TextEncoder().encode(JSON.stringify(corpo))
  const binario = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('')

  return `cabecalho.${btoa(binario).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')}.assinatura`
}

beforeEach(() => {
  sessao.encerrar()
})

afterEach(() => {
  sessao.encerrar()
})

describe('sessao', () => {
  /**
   * A regra que a mudança para cookie `HttpOnly` existe para garantir.
   *
   * Se algum dia alguém "consertar o F5" gravando o token de volta no `localStorage`, este teste
   * quebra — que é o ponto. A credencial de longa duração não pode ficar ao alcance de um XSS.
   */
  it('nunca grava nada no armazenamento do navegador', () => {
    const gravar = vi.spyOn(Storage.prototype, 'setItem')

    sessao.autenticar({ accessToken: token(), expiraEm: new Date().toISOString() })

    expect(sessao.estado().autenticado).toBe(true)
    expect(gravar).not.toHaveBeenCalled()

    gravar.mockRestore()
  })

  it('expõe o usuário lido do access token', () => {
    sessao.autenticar({ accessToken: token('Maria'), expiraEm: new Date().toISOString() })

    expect(sessao.estado().usuario?.nome).toBe('Maria')
    expect(sessao.estado().usuario?.perfis).toEqual(['Usuario'])
  })

  it('notifica os inscritos quando o estado muda', () => {
    const ouvinte = vi.fn<() => void>()
    const cancelar = sessao.inscrever(ouvinte)

    sessao.autenticar({ accessToken: token(), expiraEm: new Date().toISOString() })
    expect(ouvinte).toHaveBeenCalledTimes(1)

    cancelar()
    sessao.encerrar()
    expect(ouvinte).toHaveBeenCalledTimes(1)
  })

  /**
   * O cookie é invisível para o JavaScript, então não há como consultar localmente se existe
   * sessão: `restaurar` sempre pergunta ao servidor.
   */
  it('restaura a sessão a partir do cookie', async () => {
    servidor.use(
      http.post(REFRESH, () =>
        HttpResponse.json({ accessToken: token('Restaurada'), expiraEm: new Date().toISOString() }),
      ),
    )

    await sessao.restaurar()

    expect(sessao.estado().autenticado).toBe(true)
    expect(sessao.estado().usuario?.nome).toBe('Restaurada')
  })

  it('fica sem sessão quando o servidor recusa a renovação', async () => {
    servidor.use(http.post(REFRESH, () => HttpResponse.json({ status: 401 }, { status: 401 })))

    await sessao.restaurar()

    expect(sessao.estado().autenticado).toBe(false)
    expect(sessao.accessToken()).toBeNull()
  })

  /**
   * Renovar em paralelo rodaria a rotação do backend várias vezes, e a detecção de reúso
   * derrubaria a sessão do usuário. O bug só aparece sob concorrência.
   */
  it('compartilha uma única requisição entre renovações concorrentes', async () => {
    let chamadas = 0

    servidor.use(
      http.post(REFRESH, () => {
        chamadas += 1
        return HttpResponse.json({ accessToken: token(), expiraEm: new Date().toISOString() })
      }),
    )

    await Promise.all([sessao.renovar(), sessao.renovar(), sessao.renovar()])

    expect(chamadas).toBe(1)
  })

  /** A requisição precisa levar o cookie, que mora em outra origem. */
  it('envia as credenciais na renovação', async () => {
    let credenciais: RequestCredentials | undefined

    servidor.use(
      http.post(REFRESH, ({ request }) => {
        credenciais = request.credentials
        return HttpResponse.json({ accessToken: token(), expiraEm: new Date().toISOString() })
      }),
    )

    await sessao.renovar()

    expect(credenciais).toBe('include')
  })
})
