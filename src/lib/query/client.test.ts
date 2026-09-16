import { afterEach, describe, expect, it } from 'vitest'
import { sessao } from '@/lib/http/sessao'
import { queryClient } from './client'

function par(sub: string, formatura?: string) {
  const corpo = { sub, name: sub, email: `${sub}@exemplo.com`, role: ['Usuario'], formatura_id: formatura }
  const base64 = btoa(JSON.stringify(corpo)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
  return { access_token: `cabecalho.${base64}.assinatura`, expira_em: '2030-01-01T00:00:00Z' }
}

afterEach(() => {
  sessao.encerrar()
  queryClient.clear()
})

describe('cache por dono da sessão', () => {
  it('descarta o cache quando outra pessoa entra na mesma aba, mesmo sem logout', () => {
    sessao.autenticar(par('ana', 'f-1'))
    queryClient.setQueryData(['formandos', 'eu'], { cpf: '12345678909' })

    sessao.encerrar()
    sessao.autenticar(par('bia', 'f-1'))

    expect(queryClient.getQueryData(['formandos', 'eu'])).toBeUndefined()
  })

  it('descarta quando a formatura muda por fora dos hooks de troca', () => {
    sessao.autenticar(par('ana', 'f-1'))
    queryClient.setQueryData(['membros'], ['da turma 1'])

    sessao.autenticar(par('ana', 'f-2'))

    expect(queryClient.getQueryData(['membros'])).toBeUndefined()
  })

  it('mantém o cache na renovação do mesmo usuário na mesma formatura', () => {
    sessao.autenticar(par('ana', 'f-1'))
    queryClient.setQueryData(['membros'], ['da turma 1'])

    sessao.autenticar(par('ana', 'f-1'))

    expect(queryClient.getQueryData(['membros'])).toEqual(['da turma 1'])
  })
})
