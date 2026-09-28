import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { reais, renderizar } from '@/test/utils'
import type { Opcional, Pedido } from '../types/cobrancas.types'
import { FiltrosDaVitrine, VitrineDeItens } from './VitrineDeItens'

const API = env.VITE_API_URL
const OPCIONAIS = `${API}/api/v1/cobrancas/opcionais`
const PEDIDOS = `${API}/api/v1/pedidos`

const convite = (mudancas: Partial<Opcional> = {}): Opcional => ({
  id: 'i-1',
  tipo: 'ConviteExtra',
  descricao: 'Convite extra',
  valor_em_centavos: 18_000,
  numero_de_parcelas: 2,
  dia_de_vencimento: 10,
  primeiro_mes: '2026-09-01',
  limite_por_formando: null,
  pedidos_ate_dia: null,
  estoque: null,
  reservados: 0,
  disponivel: null,
  abertura_de_vendas: null,
  item_da_festa_id: null,
  aberto_a_pedido: true,
  ...mudancas,
})

const pedido = (mudancas: Partial<Pedido> = {}): Pedido => ({
  id: 'pe-1',
  item_de_cobranca_id: 'i-1',
  tipo: 'ConviteExtra',
  descricao: 'Convite extra',
  usuario_id: 'u-1',
  nome: 'Ana Souza',
  quantidade: 2,
  parcelas: 2,
  valor_unitario_em_centavos: 18_000,
  total_em_centavos: 36_000,
  pago_em_centavos: 0,
  quitado: false,
  status: 'Confirmado',
  pedido_em: '2026-09-05T12:00:00Z',
  cancelado_em: null,
  ...mudancas,
})

/** O que a tela mostra, e nada mais: opcionais e "meus pedidos". */
function servir(itens: Opcional[], meus: Pedido[] = []) {
  servidor.use(
    http.get(OPCIONAIS, () => HttpResponse.json(itens)),
    http.get(`${PEDIDOS}/meus`, () => HttpResponse.json(meus)),
  )
}

describe('VitrineDeItens', () => {
  it('combina categoria e busca sem acentos na URL e permite limpar os filtros', async () => {
    servir([
      convite(),
      convite({ id: 'i-2', tipo: 'Vestuario', descricao: 'Camiseta da colação' }),
      convite({ id: 'i-3', tipo: 'Vestuario', descricao: 'Moletom da turma' }),
    ])
    const usuario = userEvent.setup()
    const { router } = renderizar(
      <>
        <FiltrosDaVitrine />
        <VitrineDeItens />
      </>,
    )
    await usuario.click(await screen.findByRole('button', { name: 'Vestuário' }))
    const lista = screen.getByRole('list', { name: 'Itens disponíveis' })
    expect(within(lista).getAllByRole('listitem')).toHaveLength(2)
    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar item' }), 'colacao{Enter}')
    expect(within(lista).getAllByRole('listitem')).toHaveLength(1)
    expect(router.state.location.search).toContain('tipo=Vestuario')
    expect(router.state.location.search).toContain('busca=colacao')
    await usuario.click(screen.getByRole('button', { name: 'Convite extra' }))
    expect(screen.getByText('Nenhum item encontrado com esses filtros.')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(within(lista).getAllByRole('listitem')).toHaveLength(3)
    expect(router.state.location.search).toBe('')
  })

  it('restaura filtros da URL e ignora categoria inválida', async () => {
    servir([convite(), convite({ id: 'i-2', tipo: 'Kit', descricao: 'Kit da turma' })])
    renderizar(
      <>
        <FiltrosDaVitrine />
        <VitrineDeItens />
      </>,
      '/meus-pedidos?tipo=invalido&busca=kit',
    )
    const lista = await screen.findByRole('list', { name: 'Itens disponíveis' })
    expect(within(lista).getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('permite ajustar a própria reserva mesmo com estoque esgotado', async () => {
    servir([convite({ estoque: 2, disponivel: 0, reservados: 2 })], [pedido()])
    renderizar(<VitrineDeItens />)
    expect(await screen.findByRole('button', { name: 'Mudar quantidade' })).toBeEnabled()
  })

  /** Na tela própria, a vitrine é o conteúdo: sem nada à venda, ela diz que não há. */
  it('avisa quando a turma ainda não abriu nenhum opcional', async () => {
    servir([])

    renderizar(<VitrineDeItens />)

    expect(await screen.findByText(/ainda não abriu nenhum opcional/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pedir' })).not.toBeInTheDocument()
  })

  /** Item com teto mostra quantos restam; o sem teto não mostra número nenhum — seria ruído. */
  it('mostra a contagem só no item com estoque', async () => {
    servir([
      convite({ estoque: 80, reservados: 68, disponivel: 12 }),
      convite({ id: 'i-2', descricao: 'Kit' }),
    ])

    renderizar(<VitrineDeItens />)

    expect(await screen.findByText('Restam 12 de 80')).toBeInTheDocument()
    expect(screen.queryByText(/Restam \d+ de 0/)).not.toBeInTheDocument()
  })

  /** Antes da abertura, a data no lugar do botão — e sem contagem regressiva. */
  it('mostra a data da abertura no lugar do botão', async () => {
    servir([convite({ abertura_de_vendas: '2027-01-15', aberto_a_pedido: false })])

    renderizar(<VitrineDeItens />)

    expect(await screen.findByText(/As vendas abrem em/)).toHaveTextContent('15/01/2027')
    expect(screen.queryByRole('button', { name: 'Pedir' })).not.toBeInTheDocument()
  })

  /** Esgotado não oferece o botão a quem ainda não pediu: a API recusaria com `estoque_esgotado`. */
  it('desabilita o pedido no item esgotado', async () => {
    servir([convite({ estoque: 10, reservados: 10, disponivel: 0 })])

    renderizar(<VitrineDeItens />)

    expect(await screen.findByText('Esgotado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pedir' })).toBeDisabled()
  })

  /**
   * O calendário aparece antes de confirmar — ninguém descobre o vencimento no extrato. O pedido
   * nasce à vista, e parcelar até o teto do item é escolha de quem compra.
   */
  it('nasce à vista e mostra os vencimentos de quem escolhe parcelar', async () => {
    vi.setSystemTime(new Date(2026, 8, 5))
    servir([convite()])

    renderizar(<VitrineDeItens />)
    await userEvent.click(await screen.findByRole('button', { name: 'Pedir' }))

    const dialogo = await screen.findByRole('alertdialog')
    expect(screen.getByLabelText('Pagar em')).toHaveValue('1')
    expect(dialogo).toHaveTextContent('Parcela única, vence 10/09/2026')
    expect(dialogo).not.toHaveTextContent('10/10/2026')

    await userEvent.selectOptions(screen.getByLabelText('Pagar em'), '2')

    expect(dialogo).toHaveTextContent(reais(9_000))
    expect(dialogo).toHaveTextContent('10/10/2026')
  })

  /** A cota do item é o teto do "+": passar dela é o 409 `limite_do_item_excedido`. */
  it('trava a quantidade na cota por formando', async () => {
    servir([convite({ limite_por_formando: 2 })])

    renderizar(<VitrineDeItens />)
    await userEvent.click(await screen.findByRole('button', { name: 'Pedir' }))

    const mais = screen.getByRole('button', { name: 'Mais uma unidade' })
    await userEvent.click(mais)

    expect(screen.getByRole('status')).toHaveTextContent('2')
    expect(mais).toBeDisabled()
  })

  /** "Pedir e pagar" grava a quantidade absoluta e avisa quem hospeda a vitrine. */
  it('pede e devolve o pedido gravado para quem o hospeda', async () => {
    let corpo: unknown
    servir([convite()])
    servidor.use(
      http.post(PEDIDOS, async ({ request }) => {
        corpo = await request.json()

        return HttpResponse.json(pedido({ quantidade: 1, total_em_centavos: 18_000 }))
      }),
    )
    const aoPedir = vi.fn<(pedido: Pedido) => void>()

    renderizar(<VitrineDeItens aoPedir={aoPedir} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Pedir' }))
    await userEvent.click(screen.getByRole('button', { name: 'Pedir e pagar' }))

    await waitFor(() => expect(aoPedir).toHaveBeenCalledOnce())
    expect(corpo).toEqual({ item_de_cobranca_id: 'i-1', quantidade: 1, parcelas: 1 })
  })

  it('manda o parcelamento escolhido no pedido', async () => {
    let corpo: unknown
    servir([convite()])
    servidor.use(
      http.post(PEDIDOS, async ({ request }) => {
        corpo = await request.json()

        return HttpResponse.json(pedido({ quantidade: 1 }))
      }),
    )

    renderizar(<VitrineDeItens />)
    await userEvent.click(await screen.findByRole('button', { name: 'Pedir' }))
    await userEvent.selectOptions(screen.getByLabelText('Pagar em'), '2')
    await userEvent.click(screen.getByRole('button', { name: 'Pedir e pagar' }))

    await waitFor(() => expect(corpo).toEqual({ item_de_cobranca_id: 'i-1', quantidade: 1, parcelas: 2 }))
  })

  /** Quem já pediu vê quanto pediu, e o botão muda de verbo: é ajuste, não pedido novo. */
  it('abre na quantidade de quem já pediu e ajusta em vez de pedir de novo', async () => {
    let chamou = ''
    servir([convite()], [pedido()])
    servidor.use(
      http.put(`${PEDIDOS}/pe-1`, async ({ request }) => {
        chamou = JSON.stringify(await request.json())

        return HttpResponse.json(pedido({ quantidade: 3 }))
      }),
    )

    renderizar(<VitrineDeItens />)

    expect(await screen.findByText('Você pediu 2 unidades')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Mudar quantidade' }))
    // No pedido de pé a divisão é fixa: o aumento sai com a mesma.
    expect(screen.queryByLabelText('Pagar em')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Mais uma unidade' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(chamou).toBe('{"quantidade":3}'))
  })
})
