import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, pagina, renderizar } from '@/test/utils'
import type { Despesa, Fornecedor } from '../types/financeiro.types'
import DetalheDoFornecedorPage from './DetalheDoFornecedorPage'
import FornecedoresPage from './FornecedoresPage'

const FORNECEDORES = `${env.VITE_API_URL}/api/v1/financeiro/fornecedores`
const DESPESAS = `${env.VITE_API_URL}/api/v1/financeiro/despesas`
const FORMATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual`

/** Como a API devolve: o que é nulo não vem (`WhenWritingNull`). */
const buffet: Fornecedor = {
  id: 'fo-1',
  nome: 'Buffet Sabor',
  documento: '12345678000199',
  categoria: 'Buffet',
  email: 'contato@sabor.com.br',
  ativo: true,
  quantidade_de_despesas: 2,
  pago_em_centavos: 1_500_000,
  previsto_em_centavos: 3_000_000,
}

const grafica: Fornecedor = {
  id: 'fo-2',
  nome: 'Gráfica Boa Impressão',
  categoria: 'Convites',
  ativo: false,
  quantidade_de_despesas: 0,
  pago_em_centavos: 0,
  previsto_em_centavos: 0,
}

const despesaDoBuffet: Despesa = {
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
  status: 'Paga',
  tem_comprovante: false,
  atrasada: false,
}

function comApi() {
  servidor.use(
    http.get(FORNECEDORES, () => HttpResponse.json(pagina([buffet, grafica]))),
    // Antes de `:id`, que casaria com "resumo" e devolveria um fornecedor no lugar da contagem.
    http.get(`${FORNECEDORES}/resumo`, () => HttpResponse.json({ ativos: 1, inativos: 1 })),
    http.get(`${FORNECEDORES}/:id`, () => HttpResponse.json(buffet)),
    http.get(DESPESAS, () => HttpResponse.json(pagina([despesaDoBuffet]))),
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
  )
}

/** O cabeçalho clicável da coluna "Fornecedor", e a célula em volta, que guarda o `aria-sort`. */
const coluna = () => screen.getByRole('button', { name: 'Fornecedor' })
const cabecalho = () => coluna().closest('th')!

describe('FornecedoresPage', () => {
  afterEach(() => sessao.encerrar())

  it('lista quem a turma contrata, com o gasto e a situação de cada um', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<FornecedoresPage />)

    expect(await screen.findByRole('link', { name: 'Buffet Sabor' })).toHaveAttribute(
      'href',
      '/financeiro/fornecedores/fo-1',
    )

    const lista = screen.getByRole('region', { name: 'Lista de fornecedores' })
    expect(within(lista).getByText(/12\.345\.678\/0001-99/)).toBeInTheDocument()
    expect(within(lista).getByText('Ativo')).toBeInTheDocument()
    expect(within(lista).getByText('Inativo')).toBeInTheDocument()
    expect(within(lista).getByText('2 despesas')).toBeInTheDocument()

    // As pílulas somam o resumo da API, e não o que a página trouxe: 'Todos' é ativos + inativos.
    expect(screen.getByRole('button', { name: 'Todos 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ativos 1' })).toBeInTheDocument()
  })

  it('"Novo fornecedor" abre o cadastro em diálogo e grava', async () => {
    entrarComo('Tesoureiro')
    comApi()
    let criado: unknown
    servidor.use(
      http.post(FORNECEDORES, async ({ request }) => {
        criado = await request.json()
        return HttpResponse.json({ ...grafica, nome: 'Banda Boa Nota' }, { status: 201 })
      }),
    )

    renderizar(<FornecedoresPage />)
    await screen.findByRole('link', { name: 'Buffet Sabor' })

    await userEvent.click(screen.getByRole('button', { name: /Novo fornecedor/ }))

    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.type(within(dialogo).getByLabelText('Nome'), 'Banda Boa Nota')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(criado).toMatchObject({ nome: 'Banda Boa Nota' }))
    // Gravou e fechou: o diálogo não fica aberto por cima da lista.
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('o cabeçalho ordena em ciclo: crescente, decrescente e de volta ao padrão', async () => {
    entrarComo('Tesoureiro')
    const pedidos: { ordenar_por: string | null; descendente: string | null }[] = []
    comApi()
    servidor.use(
      http.get(FORNECEDORES, ({ request }) => {
        const query = new URL(request.url).searchParams
        pedidos.push({ ordenar_por: query.get('ordenar_por'), descendente: query.get('descendente') })
        return HttpResponse.json(pagina([buffet, grafica]))
      }),
    )

    renderizar(<FornecedoresPage />)
    await screen.findByRole('link', { name: 'Buffet Sabor' })

    expect(cabecalho()).toHaveAttribute('aria-sort', 'none')

    await userEvent.click(coluna())
    await waitFor(() => expect(cabecalho()).toHaveAttribute('aria-sort', 'ascending'))

    await userEvent.click(coluna())
    await waitFor(() => expect(cabecalho()).toHaveAttribute('aria-sort', 'descending'))

    // O terceiro clique tira a ordenação: a lista volta à ordem padrão da listagem.
    await userEvent.click(coluna())
    await waitFor(() => expect(cabecalho()).toHaveAttribute('aria-sort', 'none'))

    // Sem as repetições — o React Query refaz a mesma consulta mais de uma vez; o que importa é a
    // sequência de ordenações que chegou ao servidor.
    const sequencia = pedidos.filter(
      (pedido, i) => i === 0 || JSON.stringify(pedido) !== JSON.stringify(pedidos[i - 1]),
    )

    await waitFor(() =>
      expect(sequencia).toEqual([
        { ordenar_por: null, descendente: null },
        { ordenar_por: 'nome', descendente: null },
        { ordenar_por: 'nome', descendente: 'true' },
        { ordenar_por: null, descendente: null },
      ]),
    )
  })
})

describe('DetalheDoFornecedorPage', () => {
  afterEach(() => sessao.encerrar())

  it('mostra o cadastro completo e o que já foi lançado no nome dele', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<DetalheDoFornecedorPage />, '/financeiro/fornecedores/fo-1', '/financeiro/fornecedores/:id')

    expect(await screen.findByRole('heading', { name: 'Buffet Sabor' })).toBeInTheDocument()
    expect(screen.getByText('contato@sabor.com.br')).toBeInTheDocument()
    expect(screen.getByText(/12\.345\.678\/0001-99/)).toBeInTheDocument()
    // Sem telefone no cadastro, a linha diz isso em vez de ficar vazia.
    expect(screen.getByText('Sem telefone')).toBeInTheDocument()
    expect(await screen.findByText('Entrada do buffet 1/3')).toBeInTheDocument()
  })
})
