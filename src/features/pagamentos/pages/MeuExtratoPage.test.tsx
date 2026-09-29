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

  it('abre em "A vencer", e "Todas" fica explícito na URL', async () => {
    responder()

    const { router } = renderizar(<MeuExtratoPage />)

    expect(await screen.findByRole('button', { name: 'A vencer 2' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Mostrando 2 de 4 parcelas')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Todas 4' }))

    expect(router.state.location.search).toBe('?situacao=todas')
    expect(screen.getByText('Mostrando 4 de 4 parcelas')).toBeInTheDocument()
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

    renderizar(<MeuExtratoPage />, '/?situacao=todas')

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

  it('a lateral leva ao PIX da próxima e lista o que está em conferência', async () => {
    responder()

    renderizar(<MeuExtratoPage />)

    const proxima = await screen.findByRole('region', { name: 'Próxima parcela' })
    expect(within(proxima).getByRole('link', { name: 'Pagar com PIX' })).toHaveAttribute(
      'href',
      `/minhas-parcelas/parcelas/${vencida.id}/pagar`,
    )
    const conferencia = screen.getByRole('list', { name: 'Parcelas em conferência' })
    expect(within(conferencia).getAllByRole('listitem')).toHaveLength(1)
    expect(conferencia).toHaveTextContent('4/')
  })

  it('só a parcela que dá para pagar tem o botão; a avisada lê "Em conferência"', async () => {
    responder()

    renderizar(<MeuExtratoPage />, '/?situacao=todas')

    const pagar = await screen.findAllByRole('link', { name: /^Pagar a parcela/ })
    expect(pagar.map((link) => link.getAttribute('href'))).toEqual([
      '/minhas-parcelas/parcelas/pa-venc/pagar',
      '/minhas-parcelas/parcelas/pa-aberta/pagar',
    ])
    expect(screen.getByText('Em conferência', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Paga em 09/07/2026')).toBeInTheDocument()
    // Sprint 22: só a linha com baixa leva o recibo.
    expect(
      screen
        .getAllByRole('button', { name: /^Recibo da parcela/ })
        .map((botao) => botao.getAttribute('aria-label')),
    ).toEqual(['Recibo da parcela 1/24'])
  })

  it('sem adesão, diz de onde as parcelas vêm', async () => {
    responder({ em_aberto_em_centavos: 0, proxima: null, parcelas: [] })

    renderizar(<MeuExtratoPage />)

    expect(await screen.findByText('Nenhuma parcela ainda')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'termo da turma' })).toHaveAttribute('href', '/meu-termo')
  })

  /** Um PIX cobrindo dois meses: escolher é só o passo 1, e o QR da soma está na tela seguinte. */
  it('escolhe as parcelas do mesmo pagamento e leva o PIX da soma para a tela de pagar', async () => {
    responder()

    const { router } = renderizar(<MeuExtratoPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Pagar várias parcelas' }))
    const dialogo = await screen.findByRole('alertdialog')
    // A avisada e a paga ficam de fora: a API não as aceita no mesmo pagamento.
    const daLinha = within(dialogo).getAllByRole('row').slice(1)
    const [daVencida, daAberta] = daLinha
    expect(daLinha).toHaveLength(2)

    // Uma planilha, como a grade do termo: número da parcela, vencimento e valor em colunas.
    const cabecalho = within(dialogo)
      .getAllByRole('columnheader')
      .map((coluna) => coluna.textContent)
    expect(cabecalho).toEqual(['Parcela', 'Vencimento', 'Valor'])
    expect(within(daVencida!).getByText('2/24')).toBeInTheDocument()
    expect(within(daVencida!).getByText('10/08/2026')).toBeInTheDocument()
    expect(within(daVencida!).getByText(reais(36_120))).toBeInTheDocument()

    // Sem caixa de marcar: o clique em qualquer ponto da linha escolhe.
    await userEvent.click(within(daVencida!).getByText('10/08/2026'))
    await userEvent.click(daAberta!)
    expect(daVencida).toHaveAttribute('aria-selected', 'true')
    expect(within(dialogo).getByText(/somam/)).toHaveTextContent(reais(71_120))

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Continuar' }))

    const { pathname, search } = router.state.location
    expect(pathname + search).toBe('/minhas-parcelas/pagar?parcelas=pa-venc,pa-aberta')
  })
  it('sem nada escolhido, não dá para continuar', async () => {
    responder()

    renderizar(<MeuExtratoPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Pagar várias parcelas' }))
    const dialogo = await screen.findByRole('alertdialog')

    expect(within(dialogo).getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })

  it('pagamento parcial: a coluna mostra o que falta, e a linha diz quanto já entrou', async () => {
    responder({
      em_aberto_em_centavos: 15_000,
      proxima: null,
      parcelas: [
        parcelaDeTeste({
          id: 'pa-parcial',
          valor_pago_em_centavos: 20_000,
          valor_do_dia: {
            original_em_centavos: 35_000,
            multa_em_centavos: 0,
            juros_em_centavos: 0,
            desconto_em_centavos: 0,
            total_em_centavos: 15_000,
            dias_de_atraso: 0,
            ja_pago_em_centavos: 20_000,
          },
        }),
      ],
    })

    renderizar(<MeuExtratoPage />)

    const linha = await screen.findByRole('row', { name: /Mensalidade/ })
    expect(within(linha).getByText(`Já pagou ${reais(20_000)}`)).toBeInTheDocument()
    // O valor da coluna é o que falta, e o balão abre a conta com o abatimento.
    await userEvent.click(within(linha).getByRole('button', { name: 'Por que este valor?' }))
    const balao = within(linha).getByText('Já pago').closest('dl')!
    expect(balao).toHaveTextContent(`Já pago-${reais(20_000)}`)
    expect(balao).toHaveTextContent(`Total de hoje${reais(15_000)}`)
  })
})
