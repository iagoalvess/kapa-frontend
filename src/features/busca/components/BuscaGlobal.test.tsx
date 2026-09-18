import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { BuscaNaTurma } from '../types/busca.types'
import { BuscaGlobal } from './BuscaGlobal'

const BUSCA = `${env.VITE_API_URL}/api/v1/busca`

const achados: BuscaNaTurma = {
  membros: [{ tipo: 'Membro', id: 'u-1', titulo: 'Ana Beatriz', detalhe: 'Comissao' }],
  despesas: [{ tipo: 'Despesa', id: 'd-1', titulo: 'Buffet — saldo', detalhe: 'Sabor & Arte' }],
  fornecedores: [],
  avisos: [],
  documentos: [],
}

const vazio: BuscaNaTurma = { membros: [], despesas: [], fornecedores: [], avisos: [], documentos: [] }

/** Devolve os termos que chegaram à API — é assim que se vê o que **não** foi consultado. */
function comApi(resposta: BuscaNaTurma = achados) {
  const termos: string[] = []

  servidor.use(
    http.get(BUSCA, ({ request }) => {
      termos.push(new URL(request.url).searchParams.get('termo') ?? '')
      return HttpResponse.json(resposta)
    }),
  )

  return termos
}

describe('BuscaGlobal', () => {
  afterEach(() => sessao.encerrar())

  it('agrupa o que achou e leva para a tela de cada um', async () => {
    entrarComo('Presidente')
    comApi()

    renderizar(<BuscaGlobal />)

    await userEvent.type(screen.getByLabelText(/buscar na turma/i), 'ana')

    expect(await screen.findByRole('heading', { name: 'Membros' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Despesas' })).toBeInTheDocument()

    // O papel sai em português, e não como o contrato o grava.
    expect(screen.getByText('Comissão')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ana Beatriz/ })).toHaveAttribute(
      'href',
      '/formatura/membros/u-1',
    )
    expect(screen.getByRole('link', { name: /Buffet/ })).toHaveAttribute('href', '/financeiro/despesas/d-1')
  })

  it('com menos de três letras, não pergunta nada ao servidor', async () => {
    entrarComo('Presidente')
    const termos = comApi()

    renderizar(<BuscaGlobal />)

    const campo = screen.getByLabelText(/buscar na turma/i)
    await userEvent.type(campo, 'an')

    // O painel só abre a partir do mínimo: com duas letras não há nem consulta nem lista.
    expect(campo).toHaveValue('an')
    expect(screen.queryByRole('heading', { name: 'Membros' })).not.toBeInTheDocument()
    expect(termos).toHaveLength(0)
  })

  it('sem acerto nenhum, diz que não achou', async () => {
    entrarComo('Formando')
    comApi(vazio)

    renderizar(<BuscaGlobal />)

    await userEvent.type(screen.getByLabelText(/buscar na turma/i), 'zzz')

    await waitFor(() => expect(screen.getByText(/nada encontrado/i)).toBeInTheDocument())
  })
})
