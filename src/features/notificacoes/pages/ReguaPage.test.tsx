import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import type { Regra, Regua } from '../types/notificacoes.types'
import ReguaPage from './ReguaPage'

const REGRAS = `${env.VITE_API_URL}/api/v1/notificacoes/regras`
const HISTORICO = `${env.VITE_API_URL}/api/v1/notificacoes/historico`
const FORMATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual`

/** A faixa lê só o total: a tela pede uma linha e mostra quantos avisos já saíram. */
const historico = () =>
  http.get(HISTORICO, () =>
    HttpResponse.json({ itens: [], pagina: 1, tamanho: 1, total: 12, total_paginas: 12, tem_proxima: true }),
  )

const degrau = (id: string, dias: number, extras: Partial<Regra> = {}): Regra => ({
  id,
  gatilho: 'Vencimento',
  dias_de_deslocamento: dias,
  assunto: `Assunto ${id}`,
  ativa: true,
  avisar_tesouraria: false,
  ...extras,
})

const REGUA: Regua = {
  regras: [
    degrau('r-1', -5),
    degrau('r-2', 0),
    degrau('r-3', 3),
    degrau('r-4', 30, { avisar_tesouraria: true }),
    degrau('r-5', 3, { gatilho: 'InformePendente', assunto: '{quantidade} na fila' }),
  ],
}

function comApi() {
  servidor.use(
    http.get(REGRAS, () => HttpResponse.json(REGUA)),
    historico(),
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
  )
}

describe('ReguaPage', () => {
  afterEach(() => sessao.encerrar())

  it('lista os degraus na ordem do vencimento, com o assunto e a situação de cada um', async () => {
    entrarComo('Tesoureiro')
    servidor.use(
      http.get(REGRAS, () =>
        HttpResponse.json({ ...REGUA, regras: [degrau('r-2', 3), degrau('r-1', -2, { ativa: false })] }),
      ),
      historico(),
      http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
    )

    renderizar(<ReguaPage />)

    expect(screen.getByRole('link', { name: 'Plano de cobrança' })).toHaveAttribute('href', '/cobrancas')
    // O lembrete vem antes do vencimento, mesmo tendo chegado depois da API.
    const linhas = await screen.findAllByRole('row')
    expect(linhas[1]).toHaveTextContent('2 dias antes do vencimento')
    expect(linhas[1]).toHaveTextContent('Lembrete')
    expect(linhas[1]).toHaveTextContent('Desligado')
    expect(linhas[2]).toHaveTextContent('3 dias após o vencimento')
    expect(linhas[2]).toHaveTextContent('Em atraso')
    expect(linhas[2]).toHaveTextContent('Ativo')

    // O assunto some da tela quando o editor é a única forma de lê-lo.
    expect(within(screen.getByRole('table')).getByText('Assunto r-1')).toBeInTheDocument()
  })

  it('traz a fila da tesouraria numa seção própria, depois da régua', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<ReguaPage />)

    const cartao = await screen.findByRole('region', { name: 'Fila da tesouraria' })
    expect(within(cartao).getByText('3 dias após o aviso de pagamento')).toBeInTheDocument()
    // Vem por último, depois dos quatro degraus de vencimento.
    expect(screen.getAllByRole('row').at(-1)).toHaveTextContent('Pagamento aguardando conferência')
  })

  it('liga e desliga o degrau pela chave, mandando só a situação', async () => {
    entrarComo('Tesoureiro')
    let enviado: unknown
    servidor.use(
      http.get(REGRAS, () => HttpResponse.json(REGUA)),
      historico(),
      http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
      http.put(`${REGRAS}/r-3`, async ({ request }) => {
        enviado = await request.json()
        return HttpResponse.json({
          regras: REGUA.regras.map((r) => (r.id === 'r-3' ? { ...r, ativa: false } : r)),
        })
      }),
    )

    renderizar(<ReguaPage />)

    const chave = await screen.findByRole('switch', { name: '3 dias após o vencimento — Em atraso' })
    expect(chave).toBeChecked()

    await userEvent.click(chave)

    await waitFor(() => expect(chave).not.toBeChecked())
    expect(enviado).toEqual({ ativa: false })
  })
})
