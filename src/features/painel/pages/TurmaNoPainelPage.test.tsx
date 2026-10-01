import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import TurmaNoPainelPage from './TurmaNoPainelPage'

const TURMA = `${env.VITE_API_URL}/api/v1/admin/suporte/formaturas/f-1`

const PENDENTE = {
  id: 'f-1',
  nome: 'Medicina 2027',
  instituicao: 'UFPR',
  curso: 'Medicina',
  ano: 2027,
  semestre: 1,
  status: 'Ativa',
  criada_em: '2026-09-01T12:00:00Z',
  ativada_em: null,
  assinatura: {
    id: 'a-1',
    plano_nome: 'Premium',
    limite_de_formandos: 400,
    status: 'Pendente',
    vigente_ate: null,
    cancelada_em: null,
    contratada_em: '2026-09-01T12:00:00Z',
  },
  membros_ativos: 1,
  parcelas: 0,
  parcelas_pagas: 0,
  adesoes: 0,
  pagamentos: [],
}

const ATIVA = {
  ...PENDENTE,
  ativada_em: '2026-09-17T12:00:00Z',
  assinatura: { ...PENDENTE.assinatura, status: 'Ativa', vigente_ate: '2026-10-17T12:00:00Z' },
}

const MEMBRO = {
  usuario_id: 'u-1',
  nome: 'Ana Souza',
  email: 'ana@exemplo.com',
  papel: 'Presidente',
  ativo: true,
  desligado_em: null,
  cpf: '***.982.247-**',
}

/** A página de membros que a API devolve, e as páginas que a tela pediu. */
function interceptarMembros(total = 1) {
  const paginas: (string | null)[] = []

  servidor.use(
    http.get(`${TURMA}/membros`, ({ request }) => {
      const pagina = new URL(request.url).searchParams.get('pagina')
      paginas.push(pagina)
      return HttpResponse.json({
        itens: [MEMBRO],
        pagina: Number(pagina ?? 1),
        tamanho: 10,
        total,
        total_paginas: Math.ceil(total / 10),
        tem_proxima: Number(pagina ?? 1) * 10 < total,
      })
    }),
  )

  return paginas
}

function renderizarTurma(rota = '/painel/turmas/f-1') {
  return renderizar(<TurmaNoPainelPage />, rota, '/painel/turmas/:id')
}

describe('TurmaNoPainelPage', () => {
  /** Critério de aceite da Sprint 16: o CPF sai mascarado em todas as telas do painel. */
  it('mostra o CPF do membro mascarado, como a API o manda', async () => {
    servidor.use(http.get(TURMA, () => HttpResponse.json(PENDENTE)))
    interceptarMembros()
    renderizarTurma()

    expect(await screen.findByText('***.982.247-**')).toBeInTheDocument()
  })

  /** T4: a página dos membros vem da URL e vai ao servidor — o link da página dois abre a página dois. */
  it('pede ao servidor a página de membros que está na URL', async () => {
    servidor.use(http.get(TURMA, () => HttpResponse.json(PENDENTE)))
    const paginas = interceptarMembros(25)
    renderizarTurma('/painel/turmas/f-1?pagina=2')

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument()
    expect(paginas).toContain('2')
  })

  /**
   * A única ação de turma do painel. Ela só aparece onde resolve alguma coisa: com a licença
   * pendente ou vencida — nunca numa turma que já está ativa.
   */
  it('oferece ativar a assinatura de uma turma pendente e mostra o resultado', async () => {
    // Arrange
    servidor.use(
      http.get(TURMA, () => HttpResponse.json(PENDENTE)),
      http.post(`${TURMA}/ativar-assinatura`, () => HttpResponse.json(ATIVA)),
    )
    interceptarMembros()
    const usuario = userEvent.setup()
    renderizarTurma()

    // Act
    await usuario.click(await screen.findByRole('button', { name: 'Ativar' }))
    await usuario.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Ativar' }))

    // Assert — a resposta já é a turma nova, e a tela mostra o estado novo sem recarregar.
    expect(await screen.findByText('17/10/2026')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ativar' })).not.toBeInTheDocument()
  })

  it('não oferece a ativação numa turma que já está ativa', async () => {
    servidor.use(http.get(TURMA, () => HttpResponse.json(ATIVA)))
    interceptarMembros()
    renderizarTurma()

    expect(await screen.findByText('Medicina 2027')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ativar' })).not.toBeInTheDocument()
  })

  /** O painel não contrata por ninguém: escolher plano é decisão da comissão. */
  it('explica que turma sem plano não é ativada pelo painel', async () => {
    servidor.use(http.get(TURMA, () => HttpResponse.json({ ...PENDENTE, assinatura: null })))
    interceptarMembros()
    renderizarTurma()

    expect(await screen.findByText(/O painel não contrata por ninguém/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ativar' })).not.toBeInTheDocument()
  })

  /** P7: o estorno é escolhido no diálogo — tudo ou o que falta do ciclo —, e a turma devolvida entra na tela. */
  it('estorna um pagamento pelo proporcional', async () => {
    const pago = {
      id: 'c-1',
      plano_nome: 'Premium',
      motivo: 'Ciclo',
      meio: 'Cartao',
      valor_em_centavos: 4990,
      situacao: 'Paga',
      url: null,
      criada_em: '2026-09-17T12:00:00Z',
      paga_em: '2026-09-17T12:00:00Z',
      valor_estornado_em_centavos: null,
      estornada_em: null,
    }
    let pedido: unknown
    servidor.use(
      http.get(TURMA, () => HttpResponse.json({ ...ATIVA, pagamentos: [pago] })),
      http.post(`${TURMA}/pagamentos/c-1/estornar`, async ({ request }) => {
        pedido = await request.json()
        return HttpResponse.json({
          ...ATIVA,
          status: 'Suspensa',
          pagamentos: [{ ...pago, situacao: 'Estornada', valor_estornado_em_centavos: 2495 }],
        })
      }),
    )
    interceptarMembros()
    const usuario = userEvent.setup()

    renderizarTurma()
    await usuario.click(await screen.findByRole('button', { name: /Estornar o pagamento/ }))
    const dialogo = screen.getByRole('alertdialog')
    await usuario.click(within(dialogo).getByRole('button', { name: 'O que falta do ciclo' }))
    await usuario.click(within(dialogo).getByRole('button', { name: 'Estornar' }))

    await expect.poll(() => pedido).toEqual({ modo: 'Proporcional' })
    expect(await screen.findByText('Estornada')).toBeInTheDocument()
  })
})
