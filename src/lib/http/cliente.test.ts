import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { api } from './cliente'
import { ErroDaApi } from './erros'
import { sessao } from './sessao'

const PROTEGIDO = `${env.VITE_API_URL}/api/v1/protegido`
const REFRESH = `${env.VITE_API_URL}/api/v1/auth/refresh`

/** Responde 200 só para o token novo; o velho recebe 401, como a API faria. */
function protegidoExigindo(tokenValido: string) {
  return http.get(PROTEGIDO, ({ request }) => {
    if (request.headers.get('Authorization') === `Bearer ${tokenValido}`) {
      return HttpResponse.json({ ok: true })
    }
    return HttpResponse.json({ status: 401 }, { status: 401 })
  })
}

describe('cliente http', () => {
  beforeEach(() => {
    sessao.encerrar()
  })

  it('renova o token uma única vez quando várias chamadas recebem 401 juntas', async () => {
    let renovacoes = 0

    servidor.use(
      protegidoExigindo('novo'),
      http.post(REFRESH, () => {
        renovacoes += 1
        return HttpResponse.json({
          accessToken: 'novo',
          expiraEm: new Date().toISOString(),
        })
      }),
    )

    sessao.autenticar({ accessToken: 'velho', expiraEm: '' })

    const respostas = await Promise.all([
      api.get<{ ok: boolean }>('/api/v1/protegido'),
      api.get<{ ok: boolean }>('/api/v1/protegido'),
      api.get<{ ok: boolean }>('/api/v1/protegido'),
    ])

    expect(respostas.every((resposta) => resposta.ok)).toBe(true)
    // Renovar três vezes dispararia a detecção de reúso do backend e derrubaria a sessão.
    expect(renovacoes).toBe(1)
    expect(sessao.accessToken()).toBe('novo')
  })

  it('encerra a sessão quando a renovação é recusada', async () => {
    servidor.use(
      protegidoExigindo('impossivel'),
      http.post(REFRESH, () => HttpResponse.json({ status: 401 }, { status: 401 })),
    )

    sessao.autenticar({ accessToken: 'velho', expiraEm: '' })

    await expect(api.get('/api/v1/protegido')).rejects.toBeInstanceOf(ErroDaApi)
    expect(sessao.estado().autenticado).toBe(false)
    expect(sessao.accessToken()).toBeNull()
  })

  it('converte ProblemDetails em ErroDaApi preservando o código', async () => {
    servidor.use(
      http.get(PROTEGIDO, () =>
        HttpResponse.json(
          { status: 409, title: 'Conflito', detail: 'Já existe.', codigo: 'usuario.email_em_uso' },
          { status: 409 },
        ),
      ),
    )

    const erro = await api.get('/api/v1/protegido', { autenticar: false }).catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(ErroDaApi)
    expect((erro as ErroDaApi).status).toBe(409)
    expect((erro as ErroDaApi).codigo).toBe('usuario.email_em_uso')
    expect((erro as ErroDaApi).message).toBe('Já existe.')
  })

  it('omite da query string os parâmetros sem valor', async () => {
    let recebida = ''

    servidor.use(
      http.get(PROTEGIDO, ({ request }) => {
        recebida = new URL(request.url).search
        return HttpResponse.json({})
      }),
    )

    await api.get('/api/v1/protegido', {
      autenticar: false,
      query: { pagina: 2, busca: undefined, ativo: false },
    })

    expect(recebida).toBe('?pagina=2&ativo=false')
  })
})
