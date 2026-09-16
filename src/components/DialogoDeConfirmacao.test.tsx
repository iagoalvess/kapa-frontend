import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Button } from '@/components/ui/button'
import { renderizar } from '@/test/utils'

describe('DialogoDeConfirmacao', () => {
  it('com gatilho, abre no clique e confirma', async () => {
    const aoConfirmar = vi.fn<() => void>()
    renderizar(
      <DialogoDeConfirmacao
        gatilho={<Button>Excluir</Button>}
        titulo="Excluir o item?"
        descricao="Não há como recuperar."
        rotulo="Excluir"
        destrutivo
        aoConfirmar={aoConfirmar}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    const dialogo = await screen.findByRole('alertdialog', { name: 'Excluir o item?' })

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Excluir' }))
    expect(aoConfirmar).toHaveBeenCalledOnce()
  })

  /** Sem gatilho, quem abre é a tela — a confirmação que nasce de um envio já validado. */
  it('controlado, avisa ao desistir e não confirma', async () => {
    const aoFechar = vi.fn<() => void>()
    const aoConfirmar = vi.fn<() => void>()
    renderizar(
      <DialogoDeConfirmacao
        aberto
        aoFechar={aoFechar}
        titulo="Trocar a chave?"
        descricao="A comissão é avisada."
        rotuloDeCancelar="Revisar"
        rotulo="Trocar"
        aoConfirmar={aoConfirmar}
      />,
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Revisar' }))
    expect(aoFechar).toHaveBeenCalledOnce()
    expect(aoConfirmar).not.toHaveBeenCalled()
  })
})
