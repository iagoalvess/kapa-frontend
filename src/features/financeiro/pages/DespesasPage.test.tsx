import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, pagina, reais, renderizar } from '@/test/utils'
import type { Despesa, ResumoDeDespesas } from '../types/financeiro.types'
import DespesasPage from './DespesasPage'

/** Como a tela lê: o Testing Library normaliza o espaço fixo que o `Intl` põe depois do R$. */

const DESPESAS = `${env.VITE_API_URL}/api/v1/financeiro/despesas`
const FORNECEDORES = `${env.VITE_API_URL}/api/v1/financeiro/fornecedores`
const FORMATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual`

/** Como a API devolve: o que é nulo não vem (`WhenWritingNull`). */
const atrasada: Despesa = {
  id: 'de-1',
  lancamento_id: 'la-1',
  fornecedor_id: 'fo-1',
  fornecedor: 'Buffet Sabor',
  descricao: 'Entrada do buffet',
  categoria: 'Buffet',
  valor_em_centavos: 1_500_000,
  competencia: '2026-08-01',
  vencimento: '2026-08-10',
  numero: 1,
  total_de_parcelas: 3,
  status: 'Prevista',
  tem_comprovante: false,
  atrasada: true,
}

const paga: Despesa = {
  id: 'de-2',
  lancamento_id: 'la-2',
  descricao: 'Taxa bancária',
  categoria: 'Taxas',
  valor_em_centavos: 2_500,
  competencia: '2026-09-01',
  vencimento: '2026-09-05',
  numero: 1,
  total_de_parcelas: 1,
  status: 'Paga',
  pago_em: '2026-09-05',
  tem_comprovante: true,
  atrasada: false,
}

const soma = (quantidade: number, valor_em_centavos: number) => ({ quantidade, valor_em_centavos })

const RESUMO: ResumoDeDespesas = {
  todas: soma(4, 4_502_500),
  prevista: soma(3, 4_500_000),
  atrasada: soma(1, 1_500_000),
  paga: soma(1, 2_500),
  cancelada: soma(0, 0),
}

function comApi(despesas: Despesa[] = [atrasada, paga]) {
  servidor.use(
    http.get(DESPESAS, () => HttpResponse.json(pagina(despesas))),
    http.get(`${DESPESAS}/resumo`, () => HttpResponse.json(RESUMO)),
    http.get(FORNECEDORES, () => HttpResponse.json(pagina([]))),
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
  )
}

describe('DespesasPage', () => {
  afterEach(() => sessao.encerrar())

  it('mostra o que a turma deve, com a parcela e a situação de cada linha', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<DespesasPage />)

    expect(await screen.findByText('Entrada do buffet 1/3')).toBeInTheDocument()

    const lista = screen.getByRole('region', { name: 'Lista de despesas' })
    expect(within(lista).getByText('Buffet Sabor · Buffet')).toBeInTheDocument()
    expect(within(lista).getByText('Atrasada')).toBeInTheDocument()
    expect(within(lista).getByText('Paga')).toBeInTheDocument()
    // Sem fornecedor cadastrado a linha diz isso, em vez de ficar com uma lacuna.
    expect(within(lista).getByText('Sem fornecedor · Taxas')).toBeInTheDocument()
    expect(within(lista).getByText(reais(1_500_000))).toBeInTheDocument()
  })

  it('a faixa separa o que está atrasado do que só está a pagar', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<DespesasPage />)

    const faixa = await screen.findByRole('region', { name: 'Resumo das despesas' })

    expect(await within(faixa).findByText(reais(4_500_000))).toBeInTheDocument()
    expect(within(faixa).getByText(reais(1_500_000))).toBeInTheDocument()
    expect(within(faixa).getByText('pagar')).toBeInTheDocument()
  })

  it('o filtro de situação vai para a URL e chega à API', async () => {
    entrarComo('Tesoureiro')
    const pedidos: string[] = []
    comApi()
    servidor.use(
      http.get(DESPESAS, ({ request }) => {
        pedidos.push(request.url)
        return HttpResponse.json(pagina([atrasada]))
      }),
    )

    renderizar(<DespesasPage />)
    await screen.findByText('Entrada do buffet 1/3')

    await userEvent.click(screen.getByRole('button', { name: /Atrasadas/ }))

    await waitFor(() => expect(pedidos.at(-1)).toContain('atrasadas=true'))
  })

  it('só a despesa prevista oferece pagar e cancelar; a paga oferece o comprovante', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<DespesasPage />)

    const linhaPrevista = (await screen.findByText('Entrada do buffet 1/3')).closest('tr')!
    expect(within(linhaPrevista).getByRole('button', { name: 'Pagar' })).toBeInTheDocument()
    expect(within(linhaPrevista).getByRole('button', { name: /Cancelar/ })).toBeInTheDocument()
    expect(within(linhaPrevista).queryByRole('button', { name: 'Abrir comprovante' })).toBeNull()

    const linhaPaga = screen.getByText('Taxa bancária').closest('tr')!
    expect(within(linhaPaga).queryByRole('button', { name: 'Pagar' })).toBeNull()
    expect(within(linhaPaga).getByRole('button', { name: 'Abrir comprovante' })).toBeInTheDocument()
    // Paga se corrige (decisão 5), mas na tela dela: a linha só leva até lá.
    expect(within(linhaPaga).getByRole('link', { name: 'Taxa bancária' })).toHaveAttribute(
      'href',
      '/financeiro/despesas/de-2',
    )
  })

  it('o pagamento só é enviado com comprovante anexado', async () => {
    entrarComo('Tesoureiro')
    comApi([atrasada])

    renderizar(<DespesasPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Pagar' }))

    const registrar = within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Salvar' })
    expect(registrar).toBeDisabled()

    await userEvent.upload(
      screen.getByLabelText(/Anexar comprovante/),
      new File(['%PDF'], 'recibo.pdf', { type: 'application/pdf' }),
    )

    expect(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Salvar' })).toBeEnabled()
  })

  it('turma suspensa lê a lista, mas não lança nem paga', async () => {
    entrarComo('Tesoureiro')
    comApi()
    servidor.use(
      http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Suspensa' })),
    )

    renderizar(<DespesasPage />)

    expect(await screen.findByText('Entrada do buffet 1/3')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: /Lançar despesa/ })).toBeDisabled())
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeDisabled()
  })

  // A prestação de contas é de todo membro; o que se faz com a despesa é da Tesouraria. Quem recusa
  // de verdade é a API — a tela só não oferece o que ela recusaria.
  it('o formando lê a lista inteira, sem nenhuma ação da tesouraria', async () => {
    entrarComo('Formando')
    comApi()

    renderizar(<DespesasPage />)

    expect(await screen.findByText('Entrada do buffet 1/3')).toBeInTheDocument()
    const lista = screen.getByRole('region', { name: 'Lista de despesas' })
    expect(within(lista).getByText(reais(1_500_000))).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: /Lançar despesa/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pagar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancelar/ })).not.toBeInTheDocument()
    // O comprovante traz conta e titular do fornecedor: nem o botão aparece.
    expect(screen.queryByRole('button', { name: 'Abrir comprovante' })).not.toBeInTheDocument()
  })

  it('sem despesa nenhuma, explica o que a tela faz em vez de mostrar uma tabela vazia', async () => {
    entrarComo('Tesoureiro')
    comApi([])

    renderizar(<DespesasPage />)

    expect(await screen.findByText('Nenhuma despesa lançada')).toBeInTheDocument()
  })
})
