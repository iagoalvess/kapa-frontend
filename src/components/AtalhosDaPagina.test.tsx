import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Download, Info, Files } from 'lucide-react'
import { renderizar } from '@/test/utils'
import { expect, it, vi } from 'vitest'
import { AtalhosDaPagina } from './AtalhosDaPagina'

it('reúne navegação, informação em diálogo e ação sem tirar a pessoa da lista', async () => {
  const exportar = vi.fn<() => void>()
  renderizar(
    <AtalhosDaPagina
      atalhos={[
        { titulo: 'Documentos', para: '/documentos', icone: Files },
        {
          titulo: 'Informações',
          icone: Info,
          dialogo: {
            titulo: 'Festa de formatura',
            descricao: 'Data e local do evento.',
            conteudo: <p>Salão principal, às 22h.</p>,
          },
        },
        { titulo: 'Exportar PDF', icone: Download, aoAcionar: exportar },
      ]}
    />,
  )

  expect(screen.getByRole('link', { name: 'Documentos' })).toHaveAttribute('href', '/documentos')
  const informacoes = screen.getByRole('button', { name: 'Informações' })
  await userEvent.click(informacoes)
  expect(screen.getByRole('dialog', { name: 'Festa de formatura' })).toHaveTextContent(
    'Salão principal, às 22h.',
  )
  await userEvent.click(screen.getByRole('button', { name: 'Fechar informações' }))
  await waitFor(() => expect(informacoes).toHaveFocus())
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Exportar PDF' }))
  expect(exportar).toHaveBeenCalledTimes(1)
})

it('impede repetir uma ação enquanto ela está carregando', async () => {
  const exportar = vi.fn<() => void>()
  render(
    <AtalhosDaPagina
      atalhos={[{ titulo: 'Exportar PDF', icone: Download, aoAcionar: exportar, carregando: true }]}
    />,
  )
  const botao = screen.getByRole('button', { name: 'Exportar PDF' })
  expect(botao).toBeDisabled()
  expect(botao).toHaveAttribute('aria-busy', 'true')
  await userEvent.click(botao)
  expect(exportar).not.toHaveBeenCalled()
})
