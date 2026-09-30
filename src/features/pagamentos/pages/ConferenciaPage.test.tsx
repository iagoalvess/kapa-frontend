import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { reais, renderizar } from '@/test/utils'
import { pagaDeTeste, parcelaDeTeste } from '../dadosDeTeste'
import type { Divergencia, Informe, ValorADevolver } from '../types/pagamentos.types'
import ConferenciaPage from './ConferenciaPage'

/** Como a tela lê: o Testing Library normaliza o espaço fixo que o `Intl` põe depois do R$. */

const API = env.VITE_API_URL

const pagina = <T,>(itens: T[]) => ({
  itens,
  pagina: 1,
  tamanho: 20,
  total: itens.length,
  total_paginas: 1,
  tem_proxima: false,
})

const informe = (id: string, nome: string, dados: Partial<Informe> = {}): Informe => ({
  id,
  parcela: parcelaDeTeste({ id: `pa-${id}`, usuario_id: `u-${id}`, nome }),
  pago_em: '2026-09-12',
  valor_em_centavos: 35_000,
  devido_em_centavos: 35_000,
  tem_comprovante: false,
  meio_escolhido: 'Pix',
  status: 'Pendente',
  informado_em: '2026-09-12T13:00:00Z',
  conferido_em: null,
  ...dados,
})

const divergencia: Divergencia = {
  recebimento_id: 'r-1',
  parcela: pagaDeTeste({ nome: 'Dora Lemos' }),
  pago_em: '2026-09-01',
  devido_em_centavos: 36_120,
  recebido_em_centavos: 35_000,
  forma: 'Pix',
  baixado_por: 'Tesa Ribeiro',
}

const valorADevolver = (id: string, nome: string, dados: Partial<ValorADevolver> = {}): ValorADevolver => ({
  id,
  usuario_id: `u-${id}`,
  nome,
  origem: 'CreditoDePedido',
  status: 'ADevolver',
  valor_em_centavos: 18_000,
  tipo: 'ConviteExtra',
  descricao: 'Convite extra',
  numero_da_parcela: null,
  vencimento: null,
  criado_em: '2026-09-29T13:00:00Z',
  resolvido_em: null,
  observacao: null,
  tem_comprovante: false,
  ...dados,
})

/** A linha de um formando na planilha — é nela que a tela agrupa o que o quadro punha num cartão. */
const linhaDe = async (nome: string) => (await screen.findByText(nome)).closest('tr')!

/** Troca a situação pela pílula, que é como a tela troca de lista. */
const abrirAba = (nome: RegExp) => userEvent.click(screen.getByRole('button', { name: nome }))

function responder(
  pendentes: Informe[] = [informe('i-1', 'Ana Souza'), informe('i-2', 'Bruno Lima')],
  confirmados: Informe[] = [],
  aDevolver: ValorADevolver[] = [],
) {
  const pedidos = {
    lotes: [] as unknown[],
    recusas: [] as unknown[],
    conferidos_hoje: [] as (string | null)[],
    buscas: [] as (string | null)[],
    devolucoes: [] as { id: unknown; tipo: string | null }[],
    fechamentos: [] as unknown[],
    resolvidos: [] as (string | null)[],
  }
  servidor.use(
    http.get(`${API}/api/v1/formaturas/atual`, () => HttpResponse.json({ id: 'f-1', status: 'Ativa' })),
    // A mesma rota serve as duas listas de informes; o `status` da query diz qual.
    http.get(`${API}/api/v1/informes`, ({ request }) => {
      const query = new URL(request.url).searchParams
      pedidos.buscas.push(query.get('busca'))
      if (query.get('status') !== 'Confirmado') return HttpResponse.json(pagina(pendentes))

      pedidos.conferidos_hoje.push(query.get('conferidos_hoje'))
      return HttpResponse.json(pagina(confirmados))
    }),
    http.get(`${API}/api/v1/recebimentos/divergencias`, ({ request }) => {
      pedidos.buscas.push(new URL(request.url).searchParams.get('busca'))
      return HttpResponse.json(pagina([divergencia]))
    }),
    http.get(`${API}/api/v1/valores-a-devolver`, ({ request }) => {
      pedidos.resolvidos.push(new URL(request.url).searchParams.get('resolvidos'))
      return HttpResponse.json(pagina(aDevolver))
    }),
    // O corpo não se lê aqui: o File do jsdom não atravessa o FormData do fetch do Node. O tipo
    // multipart basta para saber que o arquivo foi junto, e é a API que exige o comprovante.
    http.post(`${API}/api/v1/valores-a-devolver/:id/devolucao`, ({ request, params }) => {
      pedidos.devolucoes.push({ id: params.id, tipo: request.headers.get('content-type') })
      return HttpResponse.json({ ...aDevolver[0], status: 'Devolvido' })
    }),
    http.post(`${API}/api/v1/valores-a-devolver/:id/fechar`, async ({ request, params }) => {
      pedidos.fechamentos.push({ id: params.id, ...((await request.json()) as object) })
      return HttpResponse.json({ ...aDevolver[0], status: 'Fechado' })
    }),
    http.post(`${API}/api/v1/informes/confirmar`, async ({ request }) => {
      pedidos.lotes.push(await request.json())
      return HttpResponse.json({ confirmados: 2, ignorados: 0 })
    }),
    http.post(`${API}/api/v1/informes/:id/recusar`, async ({ request, params }) => {
      pedidos.recusas.push({ id: params.id, ...((await request.json()) as object) })
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return pedidos
}

describe('ConferenciaPage', () => {
  it('marca os que batem e confirma o lote com o valor recebido de cada um', async () => {
    const pedidos = responder()

    renderizar(<ConferenciaPage />)

    const bruno = await linhaDe('Bruno Lima')
    const valorDoBruno = within(bruno).getByRole('textbox', { name: 'Valor recebido de Bruno Lima' })
    await userEvent.clear(valorDoBruno)
    await userEvent.type(valorDoBruno, '30000')

    // O aviso do valor diferente nasce na própria linha, antes de confirmar.
    expect(bruno).toHaveTextContent('Valor diferente')
    expect(bruno).toHaveTextContent(reais(35_000))

    // Marca pelo clique na linha; o clique no campo do valor, acima, não marcou o Bruno.
    expect(bruno).toHaveAttribute('aria-selected', 'false')
    await userEvent.click(await screen.findByText('Ana Souza'))
    await userEvent.click(bruno)
    expect(bruno).toHaveAttribute('aria-selected', 'true')

    const confirmar = await screen.findByRole('button', { name: /^Confirmar ·/ })
    expect(confirmar).toHaveTextContent(reais(65_000))
    expect(screen.getByText('2 selecionados')).toBeInTheDocument()
    await userEvent.click(confirmar)

    const dialogo = await screen.findByRole('alertdialog')
    expect(dialogo).toHaveTextContent('Confirmar 2 pagamentos')
    expect(dialogo).toHaveTextContent('A confirmação fica registrada em seu nome.')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar' }))

    await waitFor(() =>
      expect(pedidos.lotes).toEqual([
        {
          itens: [
            { informe_id: 'i-1', valor_recebido_em_centavos: 35_000 },
            { informe_id: 'i-2', valor_recebido_em_centavos: 30_000 },
          ],
        },
      ]),
    )
  })

  it('pelo teclado, Espaço na linha marca e desmarca', async () => {
    responder()

    renderizar(<ConferenciaPage />)

    const ana = await linhaDe('Ana Souza')
    ana.focus()
    await userEvent.keyboard(' ')
    expect(ana).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard(' ')
    expect(ana).toHaveAttribute('aria-selected', 'false')
  })

  it('sem nada marcado, o botão do lote não aparece', async () => {
    responder()

    renderizar(<ConferenciaPage />)

    await screen.findByText('Ana Souza')
    expect(screen.queryByRole('button', { name: /^Confirmar/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/selecionados?$/)).not.toBeInTheDocument()
  })

  it('recusa exige motivo, e o motivo vai para a API', async () => {
    const pedidos = responder()

    renderizar(<ConferenciaPage />)

    await userEvent.click(within(await linhaDe('Ana Souza')).getByRole('button', { name: 'Recusar' }))
    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Recusar' }))
    expect(
      await within(dialogo).findByText('Diga ao formando por que o pagamento foi recusado.'),
    ).toBeInTheDocument()

    await userEvent.type(within(dialogo).getByLabelText('Motivo'), 'Não achei no extrato.')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Recusar' }))

    await waitFor(() => expect(pedidos.recusas).toEqual([{ id: 'i-1', motivo: 'Não achei no extrato.' }]))
  })

  it('a lista de divergências mostra o devido, o recebido e a diferença, sem o que marcar', async () => {
    responder()

    renderizar(<ConferenciaPage />)

    await screen.findByText('Ana Souza')
    await abrirAba(/^Divergências/)

    const linha = await linhaDe('Dora Lemos')
    expect(linha).toHaveTextContent(reais(36_120))
    expect(linha).toHaveTextContent(reais(35_000))
    expect(linha).toHaveTextContent(reais(1_120))
    expect(linha).toHaveTextContent('Tesa Ribeiro')
    // Já foi baixada: não há o que confirmar de novo.
    expect(linha).not.toHaveAttribute('aria-selected')
  })

  it('a lista do dia pede só os conferidos hoje e não deixa remarcá-los', async () => {
    const pedidos = responder(
      [informe('i-1', 'Ana Souza')],
      [informe('i-9', 'Caio Prado', { status: 'Confirmado', conferido_em: '2026-09-15T11:20:00Z' })],
    )

    renderizar(<ConferenciaPage />)

    await screen.findByText('Ana Souza')
    await abrirAba(/^Confirmados hoje/)

    const linha = await linhaDe('Caio Prado')
    expect(linha).toHaveTextContent(reais(35_000))
    expect(linha).not.toHaveAttribute('aria-selected')
    expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument()

    await waitFor(() => expect(pedidos.conferidos_hoje).toContain('true'))
  })

  it('a pílula troca a lista sem perder a contagem das outras', async () => {
    responder([informe('i-1', 'Ana Souza')])

    renderizar(<ConferenciaPage />)

    await screen.findByText('Ana Souza')
    await abrirAba(/^Divergências/)

    expect(await screen.findByText('Dora Lemos')).toBeInTheDocument()
    expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument()
    // A fila continua contada na pílula, mesmo fora da vista.
    expect(screen.getByRole('button', { name: /^A conferir/ })).toHaveTextContent('1')
  })

  it('a busca vai para o servidor e atravessa as três listas', async () => {
    const pedidos = responder()

    renderizar(<ConferenciaPage />)

    await screen.findByText('Ana Souza')
    await userEvent.type(screen.getByLabelText('Buscar formando'), 'ana{enter}')

    // Pendentes, confirmados e divergências: as três consultas levam o mesmo termo.
    await waitFor(() => expect(pedidos.buscas.filter((termo) => termo === 'ana')).toHaveLength(3))
  })

  it('a aba A devolver mostra a origem e registra a devolução com o comprovante do PIX', async () => {
    const pedidos = responder([], [], [valorADevolver('v-1', 'Caio Prado')])

    renderizar(<ConferenciaPage />)

    await abrirAba(/^A devolver/)
    const linha = await linhaDe('Caio Prado')
    expect(linha).toHaveTextContent('Crédito de pedido cancelado')
    expect(linha).toHaveTextContent(reais(18_000))

    await userEvent.click(within(linha).getByRole('button', { name: 'Registrar a devolução a Caio Prado' }))
    const dialogo = await screen.findByRole('alertdialog')
    expect(dialogo).toHaveTextContent('O Kapa não devolve dinheiro')
    const registrar = within(dialogo).getByRole('button', { name: 'Registrar' })
    expect(registrar).toBeDisabled()
    await userEvent.upload(
      within(dialogo).getByLabelText(/Anexar comprovante/),
      new File(['%PDF'], 'pix.pdf', { type: 'application/pdf' }),
    )
    const habilitado = within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Registrar' })
    expect(habilitado).toBeEnabled()
    await userEvent.click(habilitado)

    await waitFor(() => expect(pedidos.devolucoes).toHaveLength(1))
    expect(pedidos.devolucoes[0]?.id).toBe('v-1')
    expect(pedidos.devolucoes[0]?.tipo).toMatch(/^multipart\/form-data/)
  })

  it('o pago sem parcela não se devolve por PIX: fecha dizendo o que foi feito', async () => {
    const pedidos = responder(
      [],
      [],
      [valorADevolver('v-2', 'Duda Reis', { origem: 'PagoSemParcela', numero_da_parcela: 4 })],
    )

    renderizar(<ConferenciaPage />)

    await abrirAba(/^A devolver/)
    const linha = await linhaDe('Duda Reis')
    expect(within(linha).queryByRole('button', { name: /Registrar a devolução/ })).not.toBeInTheDocument()

    await userEvent.click(within(linha).getByRole('button', { name: 'Fechar aviso' }))
    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Fechar aviso' }))
    expect(await within(dialogo).findByText('Diga o que foi feito com este pagamento.')).toBeInTheDocument()
    await userEvent.type(within(dialogo).getByLabelText('O que foi feito'), 'Devolvido no painel do MP')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Fechar aviso' }))

    await waitFor(() =>
      expect(pedidos.fechamentos).toEqual([{ id: 'v-2', observacao: 'Devolvido no painel do MP' }]),
    )
  })

  it('"Já resolvidos" pede a outra lista ao servidor', async () => {
    const pedidos = responder([], [], [])

    renderizar(<ConferenciaPage />)

    await abrirAba(/^A devolver/)
    expect(await screen.findByText('Nada a devolver')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Já resolvidos' }))

    await waitFor(() => expect(pedidos.resolvidos).toContain('true'))
  })

  it('sem avisos, diz que não há nada a conferir', async () => {
    responder([])

    renderizar(<ConferenciaPage />)

    expect(await screen.findByText('Nada a conferir')).toBeInTheDocument()
  })
})
