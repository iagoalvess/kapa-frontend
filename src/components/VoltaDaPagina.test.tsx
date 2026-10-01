import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, Link, Outlet, type InitialEntry } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it } from 'vitest'
import { ROTAS } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useTituloDaRota } from '@/hooks/useNavegacaoDaPagina'
import { LinkDaPagina } from './LinkDaPagina'
import { LinkDeVolta } from './LinkDeVolta'
import { VoltaDaPagina } from './VoltaDaPagina'

function Moldura() {
  const titulo = useTituloDaRota()
  return (
    <>
      <h1>{titulo}</h1>
      <VoltaDaPagina>
        <Outlet />
      </VoltaDaPagina>
    </>
  )
}

function Parcelas() {
  const { atualizar } = useFiltrosDaUrl()
  return (
    <>
      <button onClick={() => atualizar({ situacao: 'pagas' })}>Pagas</button>
      <LinkDaPagina to={ROTAS.meusPedidos}>Ver meus pedidos</LinkDaPagina>
      <Link to={ROTAS.inicio}>Início pelo menu</Link>
    </>
  )
}

function abrir(entrada: InitialEntry = `${ROTAS.adesao}?ler=nova#termo`) {
  const router = createMemoryRouter(
    [
      {
        element: <Moldura />,
        children: [
          {
            path: ROTAS.adesao,
            handle: { titulo: 'Meu termo' },
            element: <LinkDaPagina to={ROTAS.extrato}>Ver minhas parcelas</LinkDaPagina>,
          },
          { path: ROTAS.extrato, handle: { titulo: 'Minhas parcelas' }, element: <Parcelas /> },
          {
            path: ROTAS.meusPedidos,
            handle: { titulo: 'Meus pedidos' },
            element: <LinkDeVolta para={ROTAS.inicio}>Início</LinkDeVolta>,
          },
          { path: ROTAS.inicio, handle: { titulo: 'Início' }, element: <p>Resumo da turma</p> },
        ],
      },
    ],
    { initialEntries: [entrada] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('VoltaDaPagina', () => {
  it('volta ao termo com query e âncora, mesmo depois de filtrar as parcelas', async () => {
    const router = abrir()
    await userEvent.click(screen.getByRole('link', { name: 'Ver minhas parcelas' }))
    const volta = screen.getByRole('link', { name: 'Meu termo' })
    expect(volta).toHaveAttribute('href', `${ROTAS.adesao}?ler=nova#termo`)
    expect(volta.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 }).compareDocumentPosition(volta)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Pagas' }))
    expect(screen.getByRole('link', { name: 'Meu termo' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Meu termo' }))
    expect(router.state.location.pathname + router.state.location.search + router.state.location.hash).toBe(
      `${ROTAS.adesao}?ler=nova#termo`,
    )
  })

  it('oferece uma só seta e restaura o retorno anterior ao passar por três telas', async () => {
    const router = abrir()
    await userEvent.click(screen.getByRole('link', { name: 'Ver minhas parcelas' }))
    await userEvent.click(screen.getByRole('button', { name: 'Pagas' }))
    await userEvent.click(screen.getByRole('link', { name: 'Ver meus pedidos' }))
    expect(screen.getAllByRole('link')).toHaveLength(1)
    await userEvent.click(screen.getByRole('link', { name: 'Minhas parcelas' }))
    expect(router.state.location.search).toBe('?situacao=pagas')
    expect(screen.getByRole('link', { name: 'Meu termo' })).toBeInTheDocument()
  })

  it('mantém o retorno fixo quando a página é aberta diretamente', () => {
    abrir(ROTAS.meusPedidos)
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('href', ROTAS.inicio)
  })

  it('não inventa origem para acesso direto a uma tela do menu', () => {
    abrir(ROTAS.extrato)
    expect(screen.queryByRole('link', { name: 'Meu termo' })).not.toBeInTheDocument()
  })

  it.each([
    null,
    'inválido',
    {},
    { caminho: '//outro.site', titulo: 'Fora' },
    { caminho: ROTAS.adesao },
    { caminho: '/\\outro.site', titulo: 'Fora' },
  ])('ignora origem inválida: %j', (origemDaPagina) => {
    abrir({ pathname: ROTAS.meusPedidos, state: { origemDaPagina } })
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('href', ROTAS.inicio)
  })

  it('limpa a origem ao usar a navegação comum do menu', async () => {
    abrir()
    await userEvent.click(screen.getByRole('link', { name: 'Ver minhas parcelas' }))
    await userEvent.click(screen.getByRole('link', { name: 'Início pelo menu' }))
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
