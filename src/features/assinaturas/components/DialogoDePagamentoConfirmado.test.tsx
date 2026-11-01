import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderizar } from '@/test/utils'
import { DialogoDePagamentoConfirmado } from './DialogoDePagamentoConfirmado'

describe('DialogoDePagamentoConfirmado', () => {
  it('abre sobre o Início com o plano ativado e fecha limpando o recado', async () => {
    const { router } = renderizar(<DialogoDePagamentoConfirmado />, {
      pathname: '/inicio',
      state: { pagamentoConfirmado: 'Premium' },
    })

    const dialogo = await screen.findByRole('alertdialog', { name: 'Pagamento confirmado' })
    expect(dialogo).toHaveTextContent('A assinatura do plano Premium está ativa e a turma já pode usar tudo.')

    await userEvent.click(screen.getByRole('button', { name: 'Ir para a turma' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/inicio')
    expect(router.state.location.state).toBeNull()
  })

  /** Sem o recado da volta do checkout, o Início é só o Início. */
  it('sem o recado, não abre', () => {
    renderizar(<DialogoDePagamentoConfirmado />, '/inicio')

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})
