import { screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, pagina, reais, renderizar } from '@/test/utils'
import type { Despesa } from '../types/financeiro.types'
import DetalheDaDespesaPage from './DetalheDaDespesaPage'

/** Como a tela lê: o Testing Library normaliza o espaço fixo que o `Intl` põe depois do R$. */

const DESPESAS = `${env.VITE_API_URL}/api/v1/financeiro/despesas`
const FORNECEDORES = `${env.VITE_API_URL}/api/v1/financeiro/fornecedores`
const FORMATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual`

/** Uma parcela do mesmo lançamento; o que é nulo não vem da API (`WhenWritingNull`). */
const parcela = (numero: number, dados: Partial<Despesa> = {}): Despesa => ({
  id: `de-${numero}`,
  lancamento_id: 'la-1',
  fornecedor_id: 'fo-1',
  fornecedor: 'Buffet Sabor',
  descricao: 'Entrada do buffet',
  categoria: 'Buffet',
  valor_em_centavos: 100_000,
  competencia: '2026-08-01',
  vencimento: `2026-0${7 + numero}-10`,
  numero,
  total_de_parcelas: 3,
  status: 'Prevista',
  tem_comprovante: false,
  atrasada: false,
  ...dados,
})

const aVista: Despesa = parcela(1, {
  id: 'de-avista',
  lancamento_id: 'la-2',
  descricao: 'Taxa bancária',
  total_de_parcelas: 1,
})

function comApi(aberta: Despesa, lancamento: Despesa[]) {
  servidor.use(
    http.get(`${DESPESAS}/:id`, () => HttpResponse.json(aberta)),
    http.get(DESPESAS, () => HttpResponse.json(pagina(lancamento, 100))),
    http.get(FORNECEDORES, () => HttpResponse.json(pagina([], 100))),
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
  )
}

const abrir = (id: string) =>
  renderizar(<DetalheDaDespesaPage />, `/financeiro/despesas/${id}`, '/financeiro/despesas/:id')

describe('DetalheDaDespesaPage', () => {
  afterEach(() => sessao.encerrar())

  it('soma o lançamento sem a parcela cancelada, que deixou de ser compromisso', async () => {
    entrarComo('Tesoureiro')
    const paga = parcela(1, { status: 'Paga', pago_em: '2026-08-09', tem_comprovante: true })
    comApi(parcela(2), [paga, parcela(2), parcela(3, { status: 'Cancelada' })])

    abrir('de-2')

    const faixa = await screen.findByRole('region', { name: 'Resumo do lançamento' })

    // Duas linhas vigentes de R$ 1.000,00; a cancelada fica fora do total e da contagem.
    expect(await within(faixa).findByText(reais(200_000))).toBeInTheDocument()
    expect(within(faixa).getByText('de 2')).toBeInTheDocument()
  })

  it('lista as parcelas irmãs e só a aberta não é link', async () => {
    entrarComo('Tesoureiro')
    comApi(parcela(2), [parcela(1), parcela(2), parcela(3)])

    abrir('de-2')

    const lancamento = await screen.findByRole('region', { name: 'Parcelas deste lançamento' })

    expect(within(lancamento).getByRole('link', { name: '1 de 3' })).toBeInTheDocument()
    expect(within(lancamento).getByRole('link', { name: '3 de 3' })).toBeInTheDocument()
    expect(within(lancamento).queryByRole('link', { name: '2 de 3' })).not.toBeInTheDocument()
    expect(within(lancamento).getByText('nesta tela')).toBeInTheDocument()
  })

  it('na despesa à vista não há lançamento a mostrar: os dois blocos somem', async () => {
    entrarComo('Tesoureiro')
    comApi(aVista, [aVista])

    abrir('de-avista')

    expect(await screen.findByText('Taxa bancária')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Resumo do lançamento' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Parcelas deste lançamento' })).not.toBeInTheDocument()
  })

  it('a despesa cancelada não oferece editar: o servidor recusaria a correção', async () => {
    entrarComo('Tesoureiro')
    const cancelada = parcela(1, { status: 'Cancelada', total_de_parcelas: 1, lancamento_id: 'la-3' })
    comApi(cancelada, [cancelada])

    abrir('de-1')

    expect(await screen.findByText('Cancelada')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })
})
