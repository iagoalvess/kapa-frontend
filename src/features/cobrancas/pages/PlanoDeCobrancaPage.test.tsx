import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS, PERFIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { reais, renderizar } from '@/test/utils'
import type { DadosDoItem, PlanoDeCobranca, SimulacaoDoPlano } from '../types/cobrancas.types'
import PlanoDeCobrancaPage from './PlanoDeCobrancaPage'

/** Como a tela lê: o Testing Library normaliza o espaço fixo que o `Intl` põe depois do R$. */

const API = env.VITE_API_URL
const PLANOS = `${API}/api/v1/cobrancas/planos`

function entrarComo(papel: string) {
  const corpo = { sub: 'u-1', name: 'Ana', role: [PERFIS.usuario], formatura_id: 'f-1', papel }
  sessao.autenticar({
    access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  })
}

const mensalidade = {
  id: 'i-1',
  tipo: 'Mensalidade',
  valor_em_centavos: 840_000,
  numero_de_parcelas: 24,
  dia_de_vencimento: 10,
  primeiro_mes: '2027-03-01',
  em_uso: false,
} as const

/** Como a API devolve: sem vigência ainda, `vigente_desde` não vem (`WhenWritingNull`). */
const plano = (itens: PlanoDeCobranca['itens'] = [mensalidade]): PlanoDeCobranca => ({
  id: 'p-1',
  nome: 'Plano 2027',
  status: 'Rascunho',
  percentual_de_multa: 200,
  percentual_de_juros_ao_mes: 100,
  carencia_em_dias: 0,
  percentual_de_desconto_por_antecipacao: 0,
  itens,
  formandos_com_parcela: 0,
})

const simulacao = (itens: DadosDoItem[]): SimulacaoDoPlano => ({
  parcelas: itens.flatMap((item) =>
    Array.from({ length: item.numero_de_parcelas }, (_, indice) => ({
      tipo: item.tipo,
      numero: indice + 1,
      de: item.numero_de_parcelas,
      vencimento: `2027-${String((indice % 12) + 1).padStart(2, '0')}-10`,
      valor_em_centavos: item.valor_em_centavos / item.numero_de_parcelas,
    })),
  ),
  total_por_formando: itens.reduce((total, item) => total + item.valor_em_centavos, 0),
  formandos: 80,
  total_da_turma: itens.reduce((total, item) => total + item.valor_em_centavos, 0) * 80,
})

/**
 * A API do plano, com a simulação ecoando os itens pedidos. Guarda cada corpo de simulação — sem
 * `itens`, é a do plano gravado.
 */
function servir(atual: PlanoDeCobranca) {
  const simulacoes: { itens?: DadosDoItem[] }[] = []
  servidor.use(
    http.get(`${API}/api/v1/formaturas/atual`, () =>
      HttpResponse.json({ id: 'f-1', status: 'Ativa', quantidade_estimada_de_formandos: 90 }),
    ),
    http.get(PLANOS, () => HttpResponse.json([{ id: atual.id, nome: atual.nome, status: atual.status }])),
    http.get(`${PLANOS}/${atual.id}`, () => HttpResponse.json(atual)),
    http.post(`${PLANOS}/${atual.id}/simular`, async ({ request }) => {
      const corpo = (await request.json()) as { itens?: DadosDoItem[] }
      simulacoes.push(corpo)
      return HttpResponse.json(simulacao(corpo.itens ?? atual.itens))
    }),
  )
  return simulacoes
}

describe('PlanoDeCobrancaPage', () => {
  it('sem plano, cria o primeiro já com 2% de multa e 1% de juros', async () => {
    entrarComo(PAPEIS.tesoureiro)
    let criado: unknown
    servidor.use(
      http.get(`${API}/api/v1/formaturas/atual`, () => HttpResponse.json({ id: 'f-1', status: 'Ativa' })),
      http.get(PLANOS, () => HttpResponse.json([])),
      http.post(PLANOS, async ({ request }) => {
        criado = await request.json()
        return HttpResponse.json(plano([]), { status: 201 })
      }),
    )

    renderizar(<PlanoDeCobrancaPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Criar plano' }))

    await waitFor(() =>
      expect(criado).toEqual({
        nome: 'Plano da turma',
        percentual_de_multa: 200,
        percentual_de_juros_ao_mes: 100,
        carencia_em_dias: 0,
        percentual_de_desconto_por_antecipacao: 0,
      }),
    )
  })

  it('no diálogo do item novo, o resumo é a grade do servidor, com o valor por parcela virando total', async () => {
    entrarComo(PAPEIS.tesoureiro)
    const simulacoes = servir(plano([]))

    renderizar(<PlanoDeCobrancaPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Incluir item' }))

    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.type(within(dialogo).getByLabelText('Valor de cada parcela'), '35000')

    await waitFor(() =>
      expect(simulacoes.at(-1)?.itens).toEqual([
        expect.objectContaining({
          tipo: 'Mensalidade',
          valor_em_centavos: 840_000,
          numero_de_parcelas: 24,
          dia_de_vencimento: 10,
        }),
      ]),
    )
    // O resumo substitui a prévia lateral, que o diálogo esconde: o número é o mesmo, do servidor.
    expect(await within(dialogo).findByText(reais(840_000))).toBeInTheDocument()
    expect(within(dialogo).getByText(/em 24 parcelas/)).toBeInTheDocument()
  })

  it('o Presidente coloca em vigor depois de ver quantos formandos e quanto no total', async () => {
    entrarComo(PAPEIS.presidente)
    servir(plano())
    let vigorou = false
    servidor.use(
      http.post(`${PLANOS}/p-1/vigorar`, () => {
        vigorou = true
        return HttpResponse.json({ ...plano(), status: 'Vigente', vigente_desde: '2026-09-14T12:00:00Z' })
      }),
    )

    renderizar(<PlanoDeCobrancaPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Colocar em vigor' }))

    const confirmacao = await screen.findByRole('alertdialog')
    expect(confirmacao).toHaveTextContent('80 na turma')
    expect(confirmacao).toHaveTextContent(reais(67_200_000))
    await userEvent.click(within(confirmacao).getByRole('button', { name: 'Colocar em vigor' }))

    await waitFor(() => expect(vigorou).toBe(true))
  })

  it('para a tesouraria, diz quem põe em vigor em vez de mostrar o botão', async () => {
    entrarComo(PAPEIS.tesoureiro)
    servir(plano())

    renderizar(<PlanoDeCobrancaPage />)

    expect(await screen.findByText(/quem coloca o plano em vigor é o Presidente/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Colocar em vigor' })).not.toBeInTheDocument()
  })

  it('item que já gerou parcela se encerra, não se remove', async () => {
    entrarComo(PAPEIS.tesoureiro)
    servir(plano([{ ...mensalidade, em_uso: true }]))

    renderizar(<PlanoDeCobrancaPage />)

    // Os itens vivem no cartão do plano; as regras foram para o cartão lateral.
    const itens = await screen.findByRole('region', { name: 'Plano 2027' })
    expect(await within(itens).findByRole('button', { name: 'Encerrar' })).toBeInTheDocument()
    expect(within(itens).queryByRole('button', { name: 'Remover' })).not.toBeInTheDocument()
  })

  it('avisa, sem travar, quando a multa passa de 2%', async () => {
    entrarComo(PAPEIS.tesoureiro)
    servir({ ...plano(), percentual_de_multa: 500 })

    renderizar(<PlanoDeCobrancaPage />)

    // Lendo: o selo ao lado da regra gravada.
    expect(await screen.findByText('acima de 2%')).toBeInTheDocument()

    // Editando: o aviso embaixo dos campos, e o botão continua valendo.
    const regras = screen.getByRole('region', { name: 'Regras de atraso' })
    await userEvent.click(within(regras).getByRole('button', { name: 'Editar' }))
    const multa = screen.getByLabelText('Multa por atraso (%)')
    await userEvent.clear(multa)
    await userEvent.type(multa, '10')

    expect(await screen.findByText(/o formando tende a contestar a cobrança/)).toBeInTheDocument()
    // As regras abrem num diálogo, com o rodapé padrão.
    expect(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Salvar' })).toBeEnabled()
  })

  it('editar um item abre diálogo com os valores dele e salva pela API', async () => {
    entrarComo(PAPEIS.tesoureiro)
    servir(plano())
    let alterado: unknown
    servidor.use(
      http.put(`${PLANOS}/p-1/itens/i-1`, async ({ request }) => {
        alterado = await request.json()
        return HttpResponse.json(plano())
      }),
    )

    renderizar(<PlanoDeCobrancaPage />)
    const linha = await screen.findByRole('row', { name: /Mensalidade/ })
    await userEvent.click(within(linha).getByRole('button', { name: 'Editar' }))

    const dialogo = await screen.findByRole('alertdialog')
    expect(within(dialogo).getByRole('heading', { name: 'Editar mensalidade' })).toBeInTheDocument()
    expect(within(dialogo).getByLabelText('Parcelas')).toHaveValue(24)

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(alterado).toMatchObject({ tipo: 'Mensalidade' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })
})
