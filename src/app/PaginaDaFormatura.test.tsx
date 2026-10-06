import { screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import PaginaDaFormatura from './PaginaDaFormatura'

const ATUAL = `${env.VITE_API_URL}/api/v1/formaturas/atual`

/** Como a API devolve: sem data da festa, o campo vem nulo. */
const formatura = {
  id: 'f-1',
  nome: 'Medicina 2027',
  instituicao: 'UFPR',
  curso: 'Medicina',
  ano: 2027,
  semestre: 1,
  previsao_de_colacao: '2099-07-15',
  previsao_da_festa: null,
  status: 'Ativa',
  encerrada_em: null,
  ja_contratou: false,
}

function entrarComo(papel: string) {
  const corpo = { sub: 'u-1', name: 'Ana', formatura_id: 'f-1', papel }
  sessao.autenticar({
    access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  })
}

describe('PaginaDaFormatura', () => {
  afterEach(() => sessao.encerrar())

  /**
   * Assinatura e resumo de membros são da Gestão: a API recusaria ao formando. Qualquer chamada a
   * eles derruba o teste — o MSW recusa requisição não declarada.
   */
  it('o formando lê os dados e as datas, sem assinatura nem contagem de membros', async () => {
    entrarComo(PAPEIS.formando)
    servidor.use(http.get(ATUAL, () => HttpResponse.json(formatura)))

    renderizar(<PaginaDaFormatura />)

    const faixa = await screen.findByRole('region', { name: 'Resumo da formatura' })
    expect(within(faixa).getByText(/Colação · 15\/07\/2099/)).toBeInTheDocument()
    expect(within(faixa).getByText('A definir')).toBeInTheDocument()
    expect(within(faixa).getByText('em dia')).toBeInTheDocument()
    expect(within(faixa).getByText('2027.1')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Dados da formatura' })).toHaveTextContent('Medicina 2027')
    expect(screen.queryByRole('region', { name: 'Assinatura' })).not.toBeInTheDocument()
  })

  it('a Gestão vê assinatura (gratuito, sem consultar), convites e quantos já estão na turma', async () => {
    entrarComo(PAPEIS.tesoureiro)
    servidor.use(
      http.get(ATUAL, () => HttpResponse.json(formatura)),
      http.get(`${ATUAL}/membros/resumo`, () =>
        HttpResponse.json([
          { papel: 'Formando', ativo: true, quantidade: 12 },
          { papel: 'Formando', ativo: false, quantidade: 4 },
        ]),
      ),
      http.get(`${ATUAL}/convites`, () => HttpResponse.json([])),
      // Sem `/assinatura` nem `/assinatura/cobrancas`: a turma que nunca contratou está no gratuito,
      // e o MSW derrubaria o teste se a tela perguntasse.
    )

    renderizar(<PaginaDaFormatura />)

    const faixa = await screen.findByRole('region', { name: 'Resumo da formatura' })
    expect(await within(faixa).findByText('12')).toBeInTheDocument()
    expect(await screen.findByText('Plano gratuito')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Convites por e-mail' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Gerar link' })).toBeInTheDocument()
  })
})
