import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { reais, renderizar } from '@/test/utils'
import { pagaDeTeste, parcelaDeTeste, vencidaDeTeste } from '../dadosDeTeste'
import type { Extrato } from '../types/pagamentos.types'
import MeuExtratoPage from './MeuExtratoPage'

/** Como a tela lê: o Testing Library normaliza o espaço fixo que o `Intl` põe depois do R$. */

const vencida = vencidaDeTeste()
const avisada = parcelaDeTeste({
  id: 'pa-avisada',
  numero: 4,
  vencimento: '2026-09-10',
  em_conferencia: true,
})
const aberta = parcelaDeTeste({ id: 'pa-aberta', numero: 5, vencimento: '2026-10-10' })

const EXTRATO: Extrato = {
  em_aberto_em_centavos: 36_120 + 35_000 + 35_000,
  proxima: vencida,
  parcelas: [pagaDeTeste(), vencida, avisada, aberta],
}

function responder(extrato: Extrato = EXTRATO) {
  servidor.use(http.get(`${env.VITE_API_URL}/api/v1/extrato/eu`, () => HttpResponse.json(extrato)))
}

describe('MeuExtratoPage', () => {
  it('mostra na faixa quanto falta, a próxima, as pagas e as em conferência', async () => {
    responder()

    renderizar(<MeuExtratoPage />)

    const resumo = await screen.findByRole('region', { name: 'Resumo do extrato' })
    await waitFor(() => expect(resumo).toHaveTextContent(`Em aberto${reais(106_120)}`))
    expect(resumo).toHaveTextContent(`Próxima parcela${reais(36_120)}vencidavence em 10/08/2026`)
    expect(resumo).toHaveTextContent('Pagas1de 4')
    expect(resumo).toHaveTextContent('Em conferência1')
    // O "Pagar" é da linha da próxima parcela, e não do topo: um CTA só na tela.
    expect(within(resumo).queryByRole('link', { name: 'Pagar' })).not.toBeInTheDocument()
  })

  it('filtra a grade pelas pílulas de situação, com a contagem de cada uma', async () => {
    responder()

    renderizar(<MeuExtratoPage />)

    const pagas = await screen.findByRole('button', { name: 'Pagas 1' })
    expect(screen.getByRole('button', { name: 'A vencer 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vencidas 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Em conferência 1' })).toBeInTheDocument()

    await userEvent.click(pagas)

    expect(pagas).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByRole('table')).getAllByRole('rowheader')).toHaveLength(1)
    expect(screen.getByText('Mostrando 1 de 4 parcelas')).toBeInTheDocument()
  })

  /** Valor maior sem explicação é chamado no grupo da turma: a conta abre ao tocar. */
  it('a vencida mostra o valor com multa e juros, e a conta aberta ao tocar', async () => {
    responder()

    renderizar(<MeuExtratoPage />)

    const linha = (await screen.findByText('10/08/2026')).closest('tr')!
    expect(within(linha).getAllByText(reais(36_120))[0]).toBeVisible()

    // O balão é `popover` nativo, que o jsdom não abre: confere-se o alvo do gatilho e o que há
    // dentro dele. Que ele abra ancorado ao gatilho é coisa de navegador.
    const gatilho = within(linha).getByRole('button', { name: 'Por que este valor?' })
    const balao = document.getElementById(gatilho.getAttribute('popovertarget')!)!
    expect(within(balao).getByText('Multa por atraso')).toBeInTheDocument()
    expect(within(balao).getByText('Juros de 36 dias')).toBeInTheDocument()
    expect(within(balao).getByText(reais(420))).toBeInTheDocument()
  })

  it('só a parcela que dá para pagar tem o botão; a avisada lê "Em conferência"', async () => {
    responder()

    renderizar(<MeuExtratoPage />)

    const pagar = await screen.findAllByRole('link', { name: /^Pagar a parcela/ })
    expect(pagar.map((link) => link.getAttribute('href'))).toEqual([
      '/extrato/parcelas/pa-venc/pagar',
      '/extrato/parcelas/pa-aberta/pagar',
    ])
    expect(screen.getByText('Em conferência', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Paga em 09/07/2026')).toBeInTheDocument()
  })

  it('sem adesão, diz de onde as parcelas vêm', async () => {
    responder({ em_aberto_em_centavos: 0, parcelas: [] })

    renderizar(<MeuExtratoPage />)

    expect(await screen.findByText('Nenhuma parcela ainda')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'termo da turma' })).toHaveAttribute('href', '/adesao')
  })
})
