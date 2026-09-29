import { render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Chip } from './Chip'
import { FiltrosDaPlanilha } from './FiltrosDaPlanilha'

/** Uma tela de `largura` pixels, do jeito que o `matchMedia` a responde. */
function telaDe(largura: number) {
  vi.stubGlobal('matchMedia', () => ({
    matches: largura >= 1024,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

function barra() {
  render(
    <FiltrosDaPlanilha
      principal={<button type="button">Todas</button>}
      filtros={<button type="button">Pagas</button>}
      busca={{ valor: '', rotulo: 'Buscar despesa', aoBuscar: () => {} }}
      filtrosAvancados={<button type="button">Filtros</button>}
      acoes={<button type="button">Fornecedores</button>}
      acaoPrincipal={<button type="button">Nova despesa</button>}
      contagem={{ mostrando: 5, total: 47, unidade: 'despesas' }}
    />,
  )
}

describe('FiltrosDaPlanilha', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('no computador deixa tudo à vista, com a contagem', () => {
    telaDe(1280)
    barra()

    expect(screen.getByText('Mostrando 5 de 47 despesas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nova despesa' }).closest('[data-acao-fixa]')).toBeNull()
  })

  it('no celular deixa à vista o que leva a outra tela e guarda as pílulas no painel de filtros', () => {
    telaDe(390)
    render(
      <FiltrosDaPlanilha
        principal={<Chip ativo={false}>Todas</Chip>}
        filtros={[
          <Chip key="a" ativo={false}>
            A pagar
          </Chip>,
          <Chip key="p" ativo>
            Pagas
          </Chip>,
        ]}
        legenda="Situação"
        busca={{ valor: '', rotulo: 'Buscar despesa', aoBuscar: () => {} }}
        acoes={<button type="button">Fornecedores</button>}
        acaoPrincipal={<button type="button">Nova despesa</button>}
        contagem={{ mostrando: 5, total: 47, unidade: 'despesas' }}
      />,
    )

    // Sem painel da tela, a barra monta um, com as pílulas dentro e a ligada contada no botão.
    const botao = screen.getByRole('button', { name: /Filtros 1/ })
    const painel = document.getElementById(botao.getAttribute('popovertarget') ?? '') as HTMLElement
    expect(within(painel).getByRole('group', { name: 'Situação', hidden: true })).toBeInTheDocument()
    expect(within(painel).getByRole('button', { name: 'A pagar', hidden: true })).toBeInTheDocument()

    // Fora do painel: a principal, a ligada e o botão da tela; a que não está ligada, não.
    const fora = (nome: string) =>
      screen.queryAllByRole('button', { name: nome }).filter((elemento) => !painel.contains(elemento))
    expect(fora('Todas')).toHaveLength(1)
    expect(fora('Pagas')).toHaveLength(1)
    expect(fora('A pagar')).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Fornecedores' })).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Nova despesa' }).closest('[data-acao-fixa]')).not.toBeNull()
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument()
  })
})
