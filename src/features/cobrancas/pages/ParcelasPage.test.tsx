import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { pagina, reais, renderizar } from '@/test/utils'
import type { Parcela, ResumoDeParcelas } from '../types/cobrancas.types'
import ParcelasPage from './ParcelasPage'

/** Como a tela lê: o Testing Library normaliza o espaço fixo que o `Intl` põe depois do R$. */

const PARCELAS = `${env.VITE_API_URL}/api/v1/cobrancas/parcelas`

/** Como a API devolve: sem descrição nem pagamento, os campos não vêm (`WhenWritingNull`). */
const vencida: Parcela = {
  id: 'pa-1',
  usuario_id: 'u-2',
  nome: 'Bruno Lima',
  tipo: 'Mensalidade',
  numero: 3,
  de: 24,
  vencimento: '2026-08-10',
  valor_original_em_centavos: 35_000,
  status: 'Vencida',
  em_conferencia: false,
  valor_do_dia: {
    original_em_centavos: 35_000,
    multa_em_centavos: 700,
    juros_em_centavos: 420,
    desconto_em_centavos: 0,
    total_em_centavos: 36_120,
    dias_de_atraso: 36,
    ja_pago_em_centavos: 0,
  },
}

const avisada: Parcela = {
  ...vencida,
  id: 'pa-2',
  nome: 'Carla Dias',
  status: 'Aberta',
  em_conferencia: true,
}

const soma = (quantidade: number, valor_em_centavos: number) => ({ quantidade, valor_em_centavos })

const RESUMO: ResumoDeParcelas = {
  todas: soma(135, 4_725_000),
  aberta: soma(104, 3_640_000),
  vencida: soma(30, 1_050_000),
  paga: soma(1, 35_000),
  cancelada: soma(0, 0),
  vencido_atualizado_em_centavos: 1_083_600,
}

/** Responde a lista e o resumo, e guarda a query string de cada pedido dos dois. */
function registrarPedidos(itens: Parcela[] = [vencida], resumo: ResumoDeParcelas = RESUMO) {
  const pedidos = { lista: [] as URLSearchParams[], resumo: [] as URLSearchParams[] }
  servidor.use(
    http.get(`${PARCELAS}/resumo`, ({ request }) => {
      pedidos.resumo.push(new URL(request.url).searchParams)
      return HttpResponse.json(resumo)
    }),
    http.get(PARCELAS, ({ request }) => {
      pedidos.lista.push(new URL(request.url).searchParams)
      return HttpResponse.json(pagina(itens))
    }),
  )
  return pedidos
}

describe('ParcelasPage', () => {
  it('lista com o item, a posição, o valor de hoje sobre o original e a situação', async () => {
    registrarPedidos()

    renderizar(<ParcelasPage />)

    expect(await screen.findByText('Bruno Lima')).toBeInTheDocument()
    expect(screen.getByText('3/24')).toBeInTheDocument()
    expect(screen.getByText(reais(36_120))).toBeInTheDocument()
    expect(screen.getByText(`de ${reais(35_000)}`)).toBeInTheDocument()
    expect(screen.getByText('Vencida', { selector: 'span' })).toBeInTheDocument()
  })

  it('mostra "Em conferência" na parcela com aviso do formando', async () => {
    registrarPedidos([avisada])

    renderizar(<ParcelasPage />)

    expect(await screen.findByText('Em conferência')).toBeInTheDocument()
  })

  /** Sprint 9: a faixa em dinheiro e as pílulas saem de um resumo só, e não de cinco listas. */
  it('mostra a receber, vencido com encargos e recebido numa chamada de resumo', async () => {
    const pedidos = registrarPedidos()

    renderizar(<ParcelasPage />)

    const faixa = await screen.findByRole('region', { name: 'Resumo das parcelas' })
    await waitFor(() => expect(faixa).toHaveTextContent('135'))
    expect(faixa).toHaveTextContent(`A receber${reais(3_640_000)}`)
    expect(faixa).toHaveTextContent(`Vencido, com multa e juros${reais(1_083_600)}cobrar`)
    expect(faixa).toHaveTextContent(`Recebido${reais(35_000)}`)
    expect(screen.getByRole('button', { name: 'A vencer 104' })).toBeInTheDocument()
    expect(pedidos.resumo).toHaveLength(1)
    expect(pedidos.lista.every((pedido) => pedido.get('tamanho') === '20')).toBe(true)
  })

  it('filtra por situação e período pela URL', async () => {
    const pedidos = registrarPedidos()

    renderizar(<ParcelasPage />, '/?de=2026-01-01')

    await userEvent.click(await screen.findByRole('button', { name: /^Vencidas/ }))

    await waitFor(() => expect(pedidos.lista.at(-1)?.get('status')).toBe('Vencida'))
    expect(pedidos.lista.at(-1)?.get('de')).toBe('2026-01-01')
    expect(pedidos.resumo.at(-1)?.get('de')).toBe('2026-01-01')
    expect(screen.getByRole('button', { name: /^Vencidas/ })).toHaveAttribute('aria-pressed', 'true')
  })

  /** É pela busca que a tesouraria acha a parcela de quem pagou e não avisou. */
  it('busca o formando pelo nome, na lista e no resumo', async () => {
    const pedidos = registrarPedidos()

    renderizar(<ParcelasPage />)

    await userEvent.type(await screen.findByRole('searchbox', { name: 'Buscar formando' }), 'bruno{Enter}')

    await waitFor(() => expect(pedidos.lista.at(-1)?.get('busca')).toBe('bruno'))
    expect(pedidos.resumo.at(-1)?.get('busca')).toBe('bruno')
  })

  it('põe as ações de quem compõe a tela na linha de cada parcela', async () => {
    registrarPedidos([vencida, avisada])

    renderizar(
      <ParcelasPage AcoesDaLinha={({ parcela }) => <button type="button">Agir em {parcela.nome}</button>} />,
    )

    const linha = (await screen.findByText('Carla Dias')).closest('tr')!
    expect(within(linha).getByRole('button', { name: 'Agir em Carla Dias' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agir em Bruno Lima' })).toBeInTheDocument()
  })

  it('antes de qualquer adesão, explica de onde as parcelas vêm', async () => {
    registrarPedidos([], {
      ...RESUMO,
      todas: soma(0, 0),
      aberta: soma(0, 0),
      vencida: soma(0, 0),
      paga: soma(0, 0),
    })

    renderizar(<ParcelasPage />)

    expect(await screen.findByText('Nenhuma parcela ainda')).toBeInTheDocument()
    expect(screen.getByText(/nascem quando ele adere ao plano/)).toBeInTheDocument()
  })
})
