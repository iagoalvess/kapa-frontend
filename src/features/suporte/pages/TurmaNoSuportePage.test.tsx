import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import TurmaNoSuportePage from './TurmaNoSuportePage'

const TURMA = `${env.VITE_API_URL}/api/v1/admin/suporte/formaturas/f-1`

const PENDENTE = {
  id: 'f-1',
  nome: 'Medicina 2027',
  instituicao: 'UFPR',
  curso: 'Medicina',
  ano: 2027,
  semestre: 1,
  status: 'AguardandoPagamento',
  criada_em: '2026-09-01T12:00:00Z',
  ativada_em: null,
  assinatura: {
    id: 'a-1',
    plano_nome: 'Premium',
    plano_codigo: 'premium',
    limite_de_formandos: 400,
    status: 'Pendente',
    vigente_ate: null,
    cancelada_em: null,
    contratada_em: '2026-09-01T12:00:00Z',
  },
  membros: [
    {
      usuario_id: 'u-1',
      nome: 'Ana Souza',
      email: 'ana@exemplo.com',
      papel: 'Presidente',
      ativo: true,
      desligado_em: null,
      cpf: '***.982.247-**',
    },
  ],
  parcelas: 0,
  parcelas_pagas: 0,
  adesoes: 0,
}

const ATIVA = {
  ...PENDENTE,
  status: 'Ativa',
  ativada_em: '2026-09-17T12:00:00Z',
  assinatura: { ...PENDENTE.assinatura, status: 'Ativa', vigente_ate: '2026-10-17T12:00:00Z' },
}

function renderizarTurma() {
  return renderizar(<TurmaNoSuportePage />, '/suporte/formaturas/f-1', '/suporte/formaturas/:id')
}

describe('TurmaNoSuportePage', () => {
  /** Critério de aceite da Sprint 16: o CPF sai mascarado em todas as telas do painel. */
  it('mostra o CPF do membro mascarado, como a API o manda', async () => {
    servidor.use(http.get(TURMA, () => HttpResponse.json(PENDENTE)))
    renderizarTurma()

    expect(await screen.findByText('***.982.247-**')).toBeInTheDocument()
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
    const usuario = userEvent.setup()
    renderizarTurma()

    // Act
    await usuario.click(await screen.findByRole('button', { name: /Ativar assinatura/ }))
    await usuario.click(await screen.findByRole('button', { name: 'Ativar' }))

    // Assert — a resposta já é a turma nova, e a tela mostra o estado novo sem recarregar.
    // A vigência é o que só existe depois de ativar; "Ativa" aparece duas vezes (turma e licença).
    expect(await screen.findByText('17/10/2026')).toBeInTheDocument()
    expect(screen.getAllByText('Ativa')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /Ativar assinatura/ })).not.toBeInTheDocument()
  })

  it('não oferece a ativação numa turma que já está ativa', async () => {
    servidor.use(http.get(TURMA, () => HttpResponse.json(ATIVA)))
    renderizarTurma()

    expect(await screen.findByText('Medicina 2027')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ativar assinatura/ })).not.toBeInTheDocument()
  })

  /** O painel não contrata por ninguém: escolher plano é decisão da comissão. */
  it('explica que turma sem plano não é ativada pelo painel', async () => {
    servidor.use(http.get(TURMA, () => HttpResponse.json({ ...PENDENTE, assinatura: null })))
    renderizarTurma()

    expect(await screen.findByText(/Peça à comissão que escolha um plano/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ativar assinatura/ })).not.toBeInTheDocument()
  })
})
