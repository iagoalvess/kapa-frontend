import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { FormaturaDetalhe } from '@/types/formatura'
import { PrimeirosPassos } from './PrimeirosPassos'

const base = env.VITE_API_URL

const turma: FormaturaDetalhe = {
  id: 'f-1',
  nome: 'Odontologia 2027',
  curso: 'Odontologia',
  instituicao: 'UFPR',
  ano: 2027,
  semestre: 1,
  previsao_de_colacao: '2099-12-17',
  previsao_da_festa: '2099-12-19',
  status: 'Ativa',
  encerrada_em: null,
  ja_contratou: false,
}

const contagem = (papel: string, quantidade: number) => ({
  papel,
  ativo: true,
  desligado: false,
  essencial_pendente: false,
  quantidade,
})

/** Responde as duas consultas do guia e conta quantas já voltaram, para o teste saber que os dados chegaram. */
function responder(resumo: object[], planos: object[], pronto = false) {
  const estado = { respondidas: 0 }

  servidor.use(
    http.get(`${base}/api/v1/formaturas/atual/membros/resumo`, () => {
      estado.respondidas += 1
      return HttpResponse.json(resumo)
    }),
    http.get(`${base}/api/v1/cobrancas/planos`, () => {
      estado.respondidas += 1
      return HttpResponse.json(planos)
    }),
    http.get(`${base}/api/v1/adesoes/termos/vigente`, () => {
      estado.respondidas += 1
      return HttpResponse.json({ termo: pronto ? { id: 't-1' } : null })
    }),
    http.get(`${base}/api/v1/recebimentos/conta`, () => {
      estado.respondidas += 1
      return HttpResponse.json({ conta: pronto ? { meios: { dinheiro: { nome: 'Presidente' } } } : null })
    }),
    http.get(`${base}/api/v1/recebimentos/conta/mercado-pago`, () => {
      estado.respondidas += 1
      return HttpResponse.json({ provedor: null })
    }),
  )

  return estado
}

describe('Primeiros passos', () => {
  afterEach(() => sessao.encerrar())

  it('lista o que falta, na ordem do caminho, e leva a cada porta', async () => {
    entrarComo(PAPEIS.presidente)
    responder([contagem(PAPEIS.presidente, 1)], [])

    renderizar(<PrimeirosPassos turma={turma} />)

    const guia = await screen.findByRole('region', { name: 'Primeiros passos' })
    expect(within(guia).getByText('Monte a comissão')).toBeInTheDocument()
    expect(within(guia).getByText('Contrate o plano')).toBeInTheDocument()
    expect(within(guia).getByRole('link', { name: 'Monte o plano de cobrança' })).toHaveAttribute(
      'href',
      '/cobrancas',
    )
    expect(within(guia).getByRole('link', { name: 'Contrate o plano' })).toHaveAttribute(
      'href',
      '/assinatura/planos',
    )
  })

  it('some quando todos os passos estão cumpridos', async () => {
    entrarComo(PAPEIS.presidente)
    const consultas = responder(
      [contagem(PAPEIS.presidente, 2), contagem(PAPEIS.formando, 3)],
      [{ id: 'p-1', nome: 'Plano', status: 'Vigente', vigente_desde: '2099-01-01' }],
      true,
    )

    renderizar(<PrimeirosPassos turma={{ ...turma, ja_contratou: true }} />)

    // Só faz sentido afirmar a ausência depois que as duas consultas voltaram.
    await waitFor(() => expect(consultas.respondidas).toBe(5))
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Primeiros passos' })).not.toBeInTheDocument(),
    )
  })

  it('continua orientando depois da entrada do primeiro formando, se falta termo ou recebimento', async () => {
    entrarComo(PAPEIS.presidente)
    responder([contagem(PAPEIS.presidente, 1), contagem(PAPEIS.formando, 1)], [{ status: 'Vigente' }])
    renderizar(<PrimeirosPassos turma={{ ...turma, ja_contratou: true }} />)
    const guia = await screen.findByRole('region', { name: 'Primeiros passos' })
    expect(within(guia).getByRole('link', { name: 'Publique o termo de adesão' })).toHaveAttribute(
      'href',
      '/adesoes',
    )
    expect(within(guia).getByRole('link', { name: 'Configure os recebimentos' })).toHaveAttribute(
      'href',
      '/formatura#recebimentos',
    )
    expect(within(guia).queryByRole('link', { name: 'Convide os formandos' })).not.toBeInTheDocument()
    expect(within(guia).getByText(/3 de 5 etapas/)).toBeInTheDocument()
  })

  it('não exige uma comissão extra para encerrar a configuração', async () => {
    entrarComo(PAPEIS.presidente)
    const consultas = responder(
      [contagem(PAPEIS.presidente, 1), contagem(PAPEIS.formando, 1)],
      [{ status: 'Vigente' }],
      true,
    )
    renderizar(<PrimeirosPassos turma={{ ...turma, ja_contratou: true }} />)
    await waitFor(() => expect(consultas.respondidas).toBe(5))
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Primeiros passos' })).not.toBeInTheDocument(),
    )
  })

  it('não aparece com a turma fora de atividade', () => {
    entrarComo(PAPEIS.presidente)
    responder([contagem(PAPEIS.presidente, 1)], [])

    renderizar(<PrimeirosPassos turma={{ ...turma, status: 'Suspensa' }} />)

    expect(screen.queryByRole('region', { name: 'Primeiros passos' })).not.toBeInTheDocument()
  })
})
