import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, reais, renderizar } from '@/test/utils'
import type { Balancete, OpcoesDeFiltro, Solicitacao } from '../types/relatorios.types'
import RelatoriosPage from './RelatoriosPage'

const RELATORIOS = `${env.VITE_API_URL}/api/v1/relatorios`

const BALANCETE: Balancete = {
  formatura: 'Medicina 2027',
  instituicao: 'Medicina — UFPR',
  de: '2026-01-01',
  ate: '2026-09-15',
  emitido_por: 'Rafael Costa Lima',
  emitido_em: '2026-09-15T15:00:00Z',
  entradas: [{ rotulo: 'Mensalidade', quantidade: 42, valor_em_centavos: 8_400_000 }],
  saidas_por_categoria: [
    { rotulo: 'Buffet', quantidade: 3, valor_em_centavos: 2_600_000 },
    { rotulo: 'Espaço', quantidade: 1, valor_em_centavos: 900_000 },
  ],
  // Os dois quadros de saída somam o mesmo total — é o que a tela promete, e o que o teste cobra.
  saidas_por_fornecedor: [
    { rotulo: 'Buffet Sabor', quantidade: 3, valor_em_centavos: 2_600_000 },
    { rotulo: 'Sem fornecedor', quantidade: 1, valor_em_centavos: 900_000 },
  ],
  entradas_em_centavos: 8_400_000,
  saidas_em_centavos: 3_500_000,
  saldo_do_periodo_em_centavos: 4_900_000,
  saldo_acumulado_em_centavos: 8_830_000,
  // Os meses somam os totais acima — é o que a tela promete ao desenhar os dois na mesma página.
  meses: [
    { mes: '2026-01-01', entradas_em_centavos: 3_400_000, saidas_em_centavos: 900_000 },
    { mes: '2026-02-01', entradas_em_centavos: 5_000_000, saidas_em_centavos: 2_600_000 },
  ],
  // Entrou o dobro do período anterior; saiu metade.
  anterior: {
    entradas_em_centavos: 4_200_000,
    saidas_em_centavos: 7_000_000,
    resultado_em_centavos: -2_800_000,
  },
}

const NA_FILA: Solicitacao = {
  id: 's-1',
  tipo: 'Balancete',
  de: '2026-01-01',
  ate: '2026-09-15',
  status: 'NaFila',
  criado_em: '2026-09-15T15:00:00Z',
  disponivel: false,
}

const OPCOES: OpcoesDeFiltro = {
  fornecedores: [{ id: 'f-1', nome: 'Buffet Sabor' }],
  formandos: [{ id: 'u-1', nome: 'Ana Beatriz' }],
  itens: [{ id: 'i-1', nome: 'Mensalidade' }],
}

function comApi(solicitacoes: Solicitacao[] = []) {
  servidor.use(
    http.get(`${RELATORIOS}/balancete`, () => HttpResponse.json(BALANCETE)),
    http.get(`${RELATORIOS}/solicitacoes`, () => HttpResponse.json(solicitacoes)),
    http.get(`${RELATORIOS}/opcoes-de-filtro`, () => HttpResponse.json(OPCOES)),
  )
}

describe('RelatoriosPage', () => {
  afterEach(() => sessao.encerrar())

  it('mostra o resultado do período separado do saldo de hoje', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<RelatoriosPage />)

    // Na faixa: o mesmo número aparece na tabela do gráfico, que é o acumulado do período.
    const faixa = await screen.findByRole('region', { name: 'Resumo do período' })
    expect(await within(faixa).findByText(reais(4_900_000))).toBeInTheDocument()
    // O saldo em caixa não é do período: é o de hoje, e vem rotulado assim para ninguém somar os dois.
    expect(within(faixa).getByText('Saldo em caixa hoje')).toBeInTheDocument()
    expect(within(faixa).getByText(reais(8_830_000))).toBeInTheDocument()
  })

  it('abre os dois quadros de saída, que somam o mesmo total', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<RelatoriosPage />)

    expect(await screen.findByRole('region', { name: 'Saídas por categoria' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Saídas por fornecedor' })).toBeInTheDocument()
    expect(screen.getAllByText(reais(3_500_000))).toHaveLength(3)
  })

  it('o período vai para a query string, e é dele que o balancete sai', async () => {
    entrarComo('Tesoureiro')

    const pedidos: string[] = []
    servidor.use(
      http.get(`${RELATORIOS}/balancete`, ({ request }) => {
        pedidos.push(new URL(request.url).search)

        return HttpResponse.json(BALANCETE)
      }),
      http.get(`${RELATORIOS}/solicitacoes`, () => HttpResponse.json([])),
    )

    renderizar(<RelatoriosPage />, '/relatorios?de=2026-03-01&ate=2026-06-30')

    await waitFor(() => expect(pedidos[0]).toBe('?de=2026-03-01&ate=2026-06-30'))
  })

  /**
   * No formato PDF, o mesmo menu enfileira em vez de baixar — e o tipo escolhido vai no corpo.
   */
  it('em PDF, o relatório escolhido entra na fila com o tipo e o período', async () => {
    entrarComo('Tesoureiro')
    comApi()

    const solicitados: unknown[] = []
    servidor.use(
      http.post(`${RELATORIOS}/solicitacoes`, async ({ request }) => {
        solicitados.push(await request.json())

        return HttpResponse.json(NA_FILA)
      }),
    )

    renderizar(<RelatoriosPage />, '/relatorios?formato=pdf&de=2026-03-01&ate=2026-06-30')

    await userEvent.click(await screen.findByRole('button', { name: /Exportar/ }))
    await userEvent.click(screen.getByRole('button', { name: /Parcelas e pagamentos/, hidden: true }))

    await waitFor(() =>
      expect(solicitados[0]).toEqual({ tipo: 'Parcelas', de: '2026-03-01', ate: '2026-06-30' }),
    )
  })

  /**
   * O toast é o único lugar que fala da fila: nasce girando e, quando o PDF fica pronto, o arquivo
   * baixa sozinho. Sem isso, o relatório seria gerado sem nada na tela dizendo isso e sem ninguém
   * para buscá-lo.
   */
  it('o toast acompanha a geração e o PDF baixa sozinho quando fica pronto', async () => {
    entrarComo('Tesoureiro')

    const gerando = vi.spyOn(toast, 'loading')
    const pronto = vi.spyOn(toast, 'success')
    const criar = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:teste')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    // A fila está vazia até o pedido; a invalidação que ele dispara já traz o PDF pronto.
    let pedido = false
    const baixados: string[] = []
    servidor.use(
      http.get(`${RELATORIOS}/balancete`, () => HttpResponse.json(BALANCETE)),
      http.get(`${RELATORIOS}/solicitacoes`, () =>
        HttpResponse.json(pedido ? [{ ...NA_FILA, status: 'Pronta', disponivel: true }] : []),
      ),
      http.post(`${RELATORIOS}/solicitacoes`, () => {
        pedido = true

        return HttpResponse.json(NA_FILA)
      }),
      http.get(`${RELATORIOS}/solicitacoes/:id/arquivo`, ({ params }) => {
        baixados.push(String(params.id))

        return HttpResponse.arrayBuffer(new ArrayBuffer(8))
      }),
    )

    renderizar(<RelatoriosPage />, '/relatorios?formato=pdf')

    await userEvent.click(await screen.findByRole('button', { name: /Exportar/ }))
    await userEvent.click(screen.getByRole('button', { name: /Balancete do período/, hidden: true }))

    await waitFor(() =>
      expect(gerando).toHaveBeenCalledWith(
        expect.stringContaining('Gerando'),
        expect.objectContaining({ id: 's-1' }),
      ),
    )

    // O mesmo id: o aviso de pronto substitui o que estava girando, em vez de empilhar outro.
    await waitFor(() =>
      expect(pronto).toHaveBeenCalledWith(
        expect.stringContaining('pronto'),
        expect.objectContaining({ id: 's-1' }),
      ),
    )

    // Uma vez só: o `esperando` do hook impede que a consulta seguinte baixe de novo.
    await waitFor(() => expect(baixados).toEqual(['s-1']))
    expect(criar).toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  it('exporta a planilha com o período em vigor', async () => {
    entrarComo('Tesoureiro')
    comApi()

    // `createObjectURL` não existe no jsdom: o download é um `<a>` clicado, e o teste só precisa
    // saber que a API certa foi chamada.
    const criar = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:teste')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const pedidos: string[] = []
    servidor.use(
      http.get(`${RELATORIOS}/despesas.xlsx`, ({ request }) => {
        pedidos.push(new URL(request.url).search)

        return HttpResponse.text('a;b\r\n')
      }),
    )

    renderizar(<RelatoriosPage />, '/relatorios?de=2026-03-01&ate=2026-06-30')

    await userEvent.click(await screen.findByRole('button', { name: /Exportar/ }))
    await userEvent.click(screen.getByRole('button', { name: /Despesas lançadas/, hidden: true }))

    await waitFor(() => expect(pedidos[0]).toBe('?de=2026-03-01&ate=2026-06-30'))
    expect(criar).toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  /**
   * O recorte escolhido na barra chega à API — na query da planilha e no corpo do pedido de PDF.
   *
   * É a razão de o filtro existir: escolher o fornecedor e receber a turma inteira é pior que não
   * ter filtro. O do PDF vale dobrado, porque o recorte vai **gravado** na fila e é o worker que o
   * refaz depois; o que não for enviado aqui não existe para ele.
   */
  it('leva o fornecedor escolhido para a planilha e para o pedido de PDF', async () => {
    entrarComo('Tesoureiro')
    comApi()

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:teste')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const planilhas: string[] = []
    const pedidos: Record<string, unknown>[] = []
    servidor.use(
      http.get(`${RELATORIOS}/despesas.xlsx`, ({ request }) => {
        planilhas.push(new URL(request.url).searchParams.get('fornecedor_id') ?? '')

        return HttpResponse.text('a;b\r\n')
      }),
      http.post(`${RELATORIOS}/solicitacoes`, async ({ request }) => {
        pedidos.push((await request.json()) as Record<string, unknown>)

        return HttpResponse.json(NA_FILA)
      }),
    )

    renderizar(<RelatoriosPage />, '/relatorios')

    // `hidden`: os seletores moram no painel "Filtros", que é um `popover` fechado. As opções vêm de
    // uma consulta própria — sem esperá-la, o `select` só tem o "Todos".
    await screen.findByRole('option', { name: 'Buffet Sabor', hidden: true })
    await userEvent.selectOptions(screen.getByLabelText('Fornecedor'), 'f-1')

    await userEvent.click(screen.getByRole('button', { name: /Exportar/ }))
    await userEvent.click(screen.getByRole('button', { name: /Despesas lançadas/, hidden: true }))

    await waitFor(() => expect(planilhas).toEqual(['f-1']))

    // O mesmo recorte, agora no formato que passa pela fila.
    await userEvent.click(screen.getByRole('button', { name: /Exportar/ }))
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/, hidden: true }))
    await userEvent.click(screen.getByRole('button', { name: /Exportar/ }))
    await userEvent.click(screen.getByRole('button', { name: /Despesas lançadas/, hidden: true }))

    await waitFor(() => expect(pedidos[0]).toMatchObject({ tipo: 'Despesas', fornecedor_id: 'f-1' }))

    vi.restoreAllMocks()
  })

  /**
   * O recorte vive na URL e **volta inteiro** dela: o link do relatório vale a mesma coisa para quem
   * o recebe.
   *
   * O que este teste protege é a ida e a volta pelo `useFiltrosDaUrl`: ele grava um punhado de
   * parâmetros de uma vez, e quem manda só o campo que mudou apaga os outros da barra de endereço —
   * escolher o fornecedor derrubaria o formando sem ninguém ver.
   */
  it('lê o recorte da URL e não perde um filtro ao mexer no outro', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<RelatoriosPage />, '/relatorios?formando_id=u-1')

    // Veio da URL: assim que as opções chegam, o seletor abre já no formando escolhido.
    await screen.findByRole('option', { name: 'Ana Beatriz', hidden: true })
    expect(screen.getByLabelText('Formando')).toHaveValue('u-1')

    await userEvent.selectOptions(screen.getByLabelText('Fornecedor'), 'f-1')

    await waitFor(() => expect(screen.getByLabelText('Fornecedor')).toHaveValue('f-1'))
    expect(screen.getByLabelText('Formando')).toHaveValue('u-1')
  })

  /**
   * A variação compara o período com o de antes, e o sentido depende do lado: entrar mais é bom,
   * sair mais não é. O resultado fica de fora do percentual — ele cruza o zero.
   */
  it('cada indicador do período compara com o período anterior', async () => {
    entrarComo('Tesoureiro')
    comApi()

    renderizar(<RelatoriosPage />)

    const faixa = await screen.findByRole('region', { name: 'Resumo do período' })

    // Entradas dobraram (4.200.000 → 8.400.000); saídas caíram pela metade (7.000.000 → 3.500.000).
    expect(await within(faixa).findByText('+100%')).toBeInTheDocument()
    expect(within(faixa).getByText('-50%')).toBeInTheDocument()
    expect(within(faixa).getAllByText('vs. período anterior')).toHaveLength(2)
    // O resultado não leva percentual — ele cruza o zero: diz o de antes em dinheiro.
    expect(within(faixa).getByText(`antes: ${reais(-2_800_000)}`)).toBeInTheDocument()
  })
})
