import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { PAPEIS } from '@/config/perfis'
import { ErroDaApi, avisarErro } from '@/lib/http/erros'
import { sessao } from '@/lib/http/sessao'
import { vendasFechadas } from '@/lib/vendasFechadas'
import { PLANO_GRATUITO, entrarComo, renderizar } from '@/test/utils'
import { DialogoDeVendasFechadas } from './DialogoDeVendasFechadas'

/** O plano da turma no gratuito, com a venda fechada — o estado do go-live do Kapa (Sprint 61). */
const PLANO_FECHADO = { ...PLANO_GRATUITO, vendas_abertas: false, abertura_das_vendas: 'janeiro de 2027' }

describe('DialogoDeVendasFechadas', () => {
  afterEach(() => {
    act(() => vendasFechadas.fechar())
    sessao.encerrar()
  })

  it('mostra a data que veio do plano, o texto aprovado e o caminho da sugestão', async () => {
    entrarComo(PAPEIS.presidente)
    renderizar(<DialogoDeVendasFechadas />, '/', '*', PLANO_FECHADO)

    act(() => vendasFechadas.abrir())

    const dialogo = screen.getByRole('alertdialog', { name: 'Os planos pagos abrem em janeiro de 2027' })
    expect(dialogo).toHaveTextContent(
      'Até lá, a sua turma usa o Kapa de graça, com até 5 pessoas da comissão.',
    )
    expect(dialogo).toHaveTextContent('quando os planos abrirem, é só convidar os formandos.')
    expect(screen.getByRole('link', { name: 'Sugestão' })).toHaveAttribute(
      'href',
      expect.stringContaining('%5BSugest%C3%A3o%5D'),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  /** A versão curta do texto é a do celular: menos linhas, mesmo recado. */
  it('traz o texto curto para telas pequenas', () => {
    entrarComo(PAPEIS.presidente)
    renderizar(<DialogoDeVendasFechadas />, '/', '*', PLANO_FECHADO)

    act(() => vendasFechadas.abrir())

    expect(
      screen.getByText(
        'Até lá, o Kapa é de graça para a comissão, com até 5 pessoas. Aproveite para montar a cesta, o plano e a agenda; em janeiro é só convidar os formandos.',
      ),
    ).toBeInTheDocument()
  })

  /** A aba antiga: o diálogo de contratação continua montado, e a API responde a venda fechada no "Continuar". */
  it('quando a recusa veio da API, a mensagem dela é o título', () => {
    entrarComo(PAPEIS.presidente)
    renderizar(<DialogoDeVendasFechadas />)

    act(() =>
      avisarErro(
        new ErroDaApi(409, {
          codigo: 'assinatura.vendas_fechadas',
          detail: 'Os planos pagos abrem em janeiro de 2027.',
        }),
      ),
    )

    expect(
      screen.getByRole('alertdialog', { name: 'Os planos pagos abrem em janeiro de 2027.' }),
    ).toBeInTheDocument()
  })

  /** Sem data configurada, o aviso não inventa prazo. */
  it('sem a data no plano, diz "em breve"', () => {
    entrarComo(PAPEIS.presidente)
    renderizar(<DialogoDeVendasFechadas />, '/', '*', {
      ...PLANO_GRATUITO,
      vendas_abertas: false,
      abertura_das_vendas: null,
    })

    act(() => vendasFechadas.abrir())

    expect(screen.getByRole('alertdialog', { name: 'Os planos pagos abrem em breve' })).toBeInTheDocument()
  })
})
