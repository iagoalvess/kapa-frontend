import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { PrimeirosPassos as PrimeirosPassosDaTurma } from '@/features/formaturas/types/formaturas.types'
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

const NENHUM: PrimeirosPassosDaTurma = {
  comissao_montada: false,
  plano_de_cobranca_em_vigor: false,
  termo_publicado: false,
  recebimentos_configurados: false,
  plano_contratado: false,
  formandos_na_turma: false,
  concluidos: false,
}

/** Responde a consulta única do guia e conta quantas vezes ela foi feita. */
function responder(passos: Partial<PrimeirosPassosDaTurma>) {
  const estado = { respondidas: 0 }

  servidor.use(
    http.get(`${base}/api/v1/formaturas/atual/primeiros-passos`, () => {
      estado.respondidas += 1
      return HttpResponse.json({ ...NENHUM, ...passos })
    }),
  )

  return estado
}

describe('Primeiros passos', () => {
  afterEach(() => sessao.encerrar())

  it('lista o que falta, na ordem do caminho, e leva a cada porta', async () => {
    entrarComo(PAPEIS.presidente)
    responder({})

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
    const consultas = responder({
      comissao_montada: true,
      plano_de_cobranca_em_vigor: true,
      termo_publicado: true,
      recebimentos_configurados: true,
      plano_contratado: true,
      formandos_na_turma: true,
      concluidos: true,
    })

    renderizar(<PrimeirosPassos turma={{ ...turma, ja_contratou: true }} />)

    // Só faz sentido afirmar a ausência depois que a consulta voltou.
    await waitFor(() => expect(consultas.respondidas).toBe(1))
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Primeiros passos' })).not.toBeInTheDocument(),
    )
  })

  it('continua orientando depois da entrada do primeiro formando, se falta termo ou recebimento', async () => {
    entrarComo(PAPEIS.presidente)
    responder({ plano_de_cobranca_em_vigor: true, plano_contratado: true, formandos_na_turma: true })
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
    const consultas = responder({
      plano_de_cobranca_em_vigor: true,
      termo_publicado: true,
      recebimentos_configurados: true,
      plano_contratado: true,
      formandos_na_turma: true,
      concluidos: true,
    })
    renderizar(<PrimeirosPassos turma={{ ...turma, ja_contratou: true }} />)
    await waitFor(() => expect(consultas.respondidas).toBe(1))
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Primeiros passos' })).not.toBeInTheDocument(),
    )
  })

  it('não aparece nem consulta com a turma fora de atividade', async () => {
    entrarComo(PAPEIS.presidente)
    const consultas = responder({})

    renderizar(<PrimeirosPassos turma={{ ...turma, status: 'Suspensa' }} />)

    await new Promise((resolver) => setTimeout(resolver, 50))
    expect(screen.queryByRole('region', { name: 'Primeiros passos' })).not.toBeInTheDocument()
    expect(consultas.respondidas).toBe(0)
  })
})
