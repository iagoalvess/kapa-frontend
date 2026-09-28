import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pencil, X } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { renderizar } from '@/test/utils'
import { AcaoComConfirmacao, AcaoDaLinha, AcoesDaLinha } from './AcoesDaLinha'

describe('AcoesDaLinha', () => {
  it('mostra o que cada ícone faz no tooltip, e o clique chama a ação', async () => {
    const aoEditar = vi.fn<() => void>()
    const usuario = userEvent.setup()

    renderizar(
      <AcoesDaLinha rotulo="Ações da Mesa 1">
        <AcaoDaLinha rotulo="Editar" icone={Pencil} onClick={aoEditar} />
      </AcoesDaLinha>,
    )

    const editar = screen.getByRole('button', { name: 'Editar' })
    await usuario.hover(editar)
    expect(await screen.findByRole('tooltip', { name: 'Editar' })).toBeInTheDocument()

    await usuario.click(editar)
    expect(aoEditar).toHaveBeenCalledOnce()
  })

  it('o tooltip é só a ação; o nome acessível pode ter o contexto', async () => {
    const usuario = userEvent.setup()

    renderizar(
      <AcoesDaLinha rotulo="Ações da Mensalidade">
        <AcaoDaLinha rotulo="Cancelar" descricaoAcessivel="Cancelar Mensalidade" icone={X} />
      </AcoesDaLinha>,
    )

    expect(screen.getByRole('button', { name: 'Cancelar Mensalidade' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()

    await usuario.hover(screen.getByRole('button', { name: 'Cancelar Mensalidade' }))
    expect(await screen.findByRole('tooltip', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('a ação com confirmação pergunta antes de executar', async () => {
    const aoConfirmar = vi.fn<() => void>()
    const usuario = userEvent.setup()

    renderizar(
      <AcoesDaLinha rotulo="Ações da Mesa 1">
        <AcaoComConfirmacao
          rotulo="Excluir"
          icone={X}
          confirmacao={{ titulo: 'Excluir “Mesa 1”?', descricao: 'Some.', rotulo: 'Excluir', aoConfirmar }}
        />
      </AcoesDaLinha>,
    )

    await usuario.click(screen.getByRole('button', { name: 'Excluir' }))
    const dialogo = await screen.findByRole('alertdialog')
    expect(within(dialogo).getByText('Excluir “Mesa 1”?')).toBeInTheDocument()

    await usuario.click(within(dialogo).getByRole('button', { name: 'Excluir' }))
    expect(aoConfirmar).toHaveBeenCalledOnce()
  })

  it('a ação desabilitada mostra o tooltip, mas não abre a confirmação', async () => {
    const aoConfirmar = vi.fn<() => void>()
    const usuario = userEvent.setup()

    renderizar(
      <AcoesDaLinha rotulo="Ações da Mesa 1">
        <AcaoComConfirmacao
          rotulo="Excluir"
          icone={X}
          desabilitada
          confirmacao={{ titulo: 'Excluir?', descricao: 'Some.', rotulo: 'Excluir', aoConfirmar }}
        />
      </AcoesDaLinha>,
    )

    const excluir = screen.getByRole('button', { name: 'Excluir' })
    expect(excluir).toBeDisabled()

    await usuario.hover(excluir)
    expect(await screen.findByRole('tooltip', { name: 'Excluir' })).toBeInTheDocument()

    await usuario.click(excluir)
    expect(aoConfirmar).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})
