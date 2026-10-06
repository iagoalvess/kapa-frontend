import { screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PERFIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { PLANO_COMPLETO, PLANO_ESSENCIAL, PLANO_GRATUITO, entrarComo, renderizar } from '@/test/utils'
import { BarraLateral } from './BarraLateral'

const API = `${env.VITE_API_URL}/api/v1`

function comApi() {
  servidor.use(
    http.get(`${API}/formaturas/atual`, () =>
      HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Suspensa' }),
    ),
    http.get(`${API}/adesoes/eu/situacao`, () =>
      HttpResponse.json({ termo_publicado: true, plano_vigente: true, aderiu: true }),
    ),
    http.get(`${API}/extrato/eu/pendencias`, () => HttpResponse.json({ vencidas_sem_aviso: 2 })),
  )
}

describe('BarraLateral', () => {
  afterEach(() => sessao.encerrar())

  it('leva a comissão às listas da turma com um item de cada', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<BarraLateral />)

    const menu = within(screen.getByRole('navigation', { name: 'Principal' }))
    expect(menu.getAllByRole('link', { name: /^Parcelas/ })).toHaveLength(1)
    expect(menu.getByRole('link', { name: /^Parcelas/ })).toHaveAttribute('href', '/cobrancas/parcelas')
    expect(menu.getAllByRole('link', { name: 'Pedidos' })).toHaveLength(1)
    expect(menu.getByRole('link', { name: 'Pedidos' })).toHaveAttribute('href', '/cobrancas/pedidos')
    expect(menu.getByRole('link', { name: 'Formatura' })).toHaveAttribute('href', ROTAS.formatura)
  })

  it('leva o formando às listas pessoais com os mesmos nomes', async () => {
    entrarComo('Formando')
    comApi()

    renderizar(<BarraLateral />)

    const menu = within(screen.getByRole('navigation', { name: 'Principal' }))
    expect(menu.getAllByRole('link', { name: /^Parcelas/ })).toHaveLength(1)
    expect(menu.getByRole('link', { name: /^Parcelas/ })).toHaveAttribute('href', '/minhas-parcelas')
    expect(menu.getAllByRole('link', { name: 'Pedidos' })).toHaveLength(1)
    expect(menu.getByRole('link', { name: 'Pedidos' })).toHaveAttribute('href', '/meus-pedidos')
    expect(menu.getByRole('link', { name: 'Formatura' })).toHaveAttribute('href', ROTAS.formatura)
  })

  /** Decisão do dono de 06/10/2026: antes de aderir, o menu do formando é o que a guarda `ExigeAdesao` abre. */
  it('o formando sem adesão vê só o termo e as parcelas', async () => {
    entrarComo('Formando')
    comApi()
    servidor.use(
      http.get(`${API}/adesoes/eu/situacao`, () =>
        HttpResponse.json({ termo_publicado: true, plano_vigente: true, aderiu: false }),
      ),
    )

    renderizar(<BarraLateral />)

    const menu = within(screen.getByRole('navigation', { name: 'Principal' }))
    expect(await menu.findByRole('link', { name: /^Meu termo/ })).toHaveAttribute('href', ROTAS.adesao)
    await waitFor(() => expect(menu.queryByRole('link', { name: 'Formatura' })).not.toBeInTheDocument())
    expect(menu.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      ROTAS.adesao,
      ROTAS.extrato,
    ])
  })

  it('deixa os lembretes dentro do Plano para a tesouraria', () => {
    entrarComo('Tesoureiro')
    comApi()
    servidor.use(
      http.get(`${API}/informes`, () => HttpResponse.json({ itens: [], total: 0 })),
      http.get(`${API}/financeiro/despesas/resumo`, () => HttpResponse.json({ atrasada: { quantidade: 0 } })),
    )

    renderizar(<BarraLateral />)

    const menu = within(screen.getByRole('navigation', { name: 'Principal' }))
    expect(menu.getByRole('link', { name: 'Plano' })).toHaveAttribute('href', '/cobrancas')
    expect(menu.queryByRole('link', { name: 'Lembretes' })).not.toBeInTheDocument()
  })

  /** Sprint 45: fora do plano, a Gestão vê o item com cadeado — ele leva à vitrine da área, e não some. */
  it('no gratuito, a comissão vê as áreas de fora do plano com cadeado', () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<BarraLateral />, '/', '*', PLANO_GRATUITO)

    const menu = within(screen.getByRole('navigation', { name: 'Principal' }))
    const mural = menu.getByRole('link', { name: /^Mural/ })
    expect(mural).toHaveAttribute('href', ROTAS.mural)
    expect(mural).toHaveTextContent('fora do plano da turma')
    expect(menu.getByRole('link', { name: /^Portaria/ })).toHaveTextContent('fora do plano da turma')
    expect(menu.getByRole('link', { name: 'Membros' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver planos' })).toHaveAttribute('href', ROTAS.planos)
  })

  /**
   * O padrão `useAtalhoNoMenu` (docs/menu-e-planos.md): o atalho só sai do menu quando a tela que o
   * abriga está no plano. A Portaria é Essencial e abriga-se em A festa, que é Premium.
   */
  it('no Essencial, a Portaria fica no menu — A festa, que a abriga, está fora do plano', () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<BarraLateral />, '/', '*', PLANO_ESSENCIAL)

    const menu = within(screen.getByRole('navigation', { name: 'Principal' }))
    const portaria = menu.getByRole('link', { name: 'Portaria' })
    expect(portaria).toHaveAttribute('href', ROTAS.portaria)
    // O Essencial tem `festa`: a Portaria abre, não é vitrine.
    expect(portaria).not.toHaveTextContent('fora do plano da turma')
  })

  it('no Premium, a Portaria sai do menu — o card dentro de A festa é o caminho', () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<BarraLateral />, '/', '*', PLANO_COMPLETO)

    const menu = within(screen.getByRole('navigation', { name: 'Principal' }))
    expect(menu.queryByRole('link', { name: 'Portaria' })).not.toBeInTheDocument()
  })

  /** Quem contrata é a comissão: para o formando, a área fora do plano seria só uma porta trancada. */
  it('no gratuito, o formando não vê as áreas de fora do plano', () => {
    entrarComo('Formando')
    comApi()

    renderizar(<BarraLateral />, '/', '*', PLANO_GRATUITO)

    const menu = within(screen.getByRole('navigation', { name: 'Principal' }))
    expect(menu.queryByRole('link', { name: /Mural/ })).not.toBeInTheDocument()
    expect(menu.queryByRole('link', { name: /Meus convites/ })).not.toBeInTheDocument()
    expect(menu.getByRole('link', { name: 'Agenda' })).toBeInTheDocument()
  })

  /**
   * Sprint 44 (D4, E3): quem é da Kapa vê o menu do painel, e não o das turmas. Sem nenhum handler de turma
   * declarado: o MSW recusa pedido não previsto, então o teste também prova que o menu do painel não consulta
   * parcela, termo nem cadastro — que a API recusaria com 403.
   */
  it('mostra ao administrador sem turma só o menu do painel', () => {
    const corpo = { sub: 'u-1', name: 'Suporte', email: 'admin@kapa.dev', role: [PERFIS.administrador] }
    sessao.autenticar({
      access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
      expira_em: new Date(Date.now() + 900_000).toISOString(),
    })

    renderizar(<BarraLateral />)

    const menu = within(screen.getByRole('navigation', { name: 'Painel do Kapa' }))
    expect(menu.getByRole('link', { name: 'Visão geral' })).toHaveAttribute('href', ROTAS.painelVisaoGeral)
    expect(menu.getByRole('link', { name: 'Turmas' })).toHaveAttribute('href', ROTAS.painelTurmas)
    expect(menu.getByRole('link', { name: 'Contas' })).toHaveAttribute('href', ROTAS.painelContas)
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Suporte' })).not.toBeInTheDocument()
  })
})
