import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, pagina, renderizar } from '@/test/utils'
import { PaginaInicial } from './PaginaInicial'

const base = env.VITE_API_URL
const turma = {
  id: 'f-1',
  nome: 'Odontologia 2027',
  curso: 'Odontologia',
  instituicao: 'UFPR',
  criado_em: '2026-09-01T12:00:00Z',
  previsao_de_colacao: '2099-12-17',
  previsao_da_festa: '2099-12-19',
}
/** A festa como a agenda a devolve: é dela que sai o bloco "Próximas datas". */
const festaNaAgenda = {
  id: 'e-1',
  titulo: 'Festa de formatura',
  tipo: 'Festa',
  situacao: 'AConfirmar',
  data: '2099-12-19',
  hora: null,
  local: null,
  descricao: null,
}

function responderTurma(dados: object) {
  servidor.use(http.get(`${base}/api/v1/formaturas/atual`, () => HttpResponse.json(dados)))
}

/** O resumo da agenda, que desde a Sprint 19 é a origem das próximas datas do Início. */
function responderAgenda(proximos: object[]) {
  servidor.use(
    http.get(`${base}/api/v1/agenda/resumo`, () => HttpResponse.json({ proximos, total: proximos.length })),
  )
}

describe('Página inicial', () => {
  beforeEach(() => {
    entrarComo(PAPEIS.formando)
    responderTurma(turma)
    responderAgenda([festaNaAgenda])
    servidor.use(
      http.get(`${base}/api/v1/festa/meta`, () =>
        HttpResponse.json({ custo_em_centavos: 0, arrecadado_em_centavos: 0 }),
      ),
      http.get(`${base}/api/v1/comunicacao/documentos`, () => HttpResponse.json(pagina([]))),
      http.get(`${base}/api/v1/festa/itens`, () => HttpResponse.json([])),
      http.get(`${base}/api/v1/extrato/eu`, () => HttpResponse.json({ proxima: null })),
      http.get(`${base}/api/v1/comunicacao/avisos`, () => HttpResponse.json(pagina([]))),
    )
  })
  afterEach(() => sessao.encerrar())

  it('apresenta as datas reais, o orçamento em preparação e o extrato em dia', async () => {
    renderizar(<PaginaInicial />)
    const jornada = await screen.findByRole('region', { name: 'Sua jornada até a formatura' })
    expect(within(jornada).getByText('dias para a festa')).toBeInTheDocument()
    // A mesma data no contador e na lista de próximas — a segunda vem da agenda.
    await screen.findByRole('list', { name: 'Próximas datas da turma' })
    expect(within(jornada).getAllByText('19/12/2099')).toHaveLength(2)
    expect(await screen.findByText('Toda festa começa com uma ideia.')).toBeInTheDocument()
    expect(await screen.findByText(/Você está em dia/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver a festa' })).toHaveAttribute('href', '/festa')
  })

  it('usa a colação quando a API omite a data da festa', async () => {
    const { previsao_da_festa: _, ...semFesta } = turma
    responderTurma(semFesta)
    responderAgenda([
      { ...festaNaAgenda, id: 'e-2', titulo: 'Colação de grau', tipo: 'Colacao', data: '2099-12-17' },
    ])
    renderizar(<PaginaInicial />)
    expect(await screen.findByText('dias para a colação')).toBeInTheDocument()

    // As próximas datas vêm da agenda, e não mais dos dois campos do cadastro.
    const proximas = await screen.findByRole('list', { name: 'Próximas datas da turma' })
    expect(within(proximas).getByText('Colação de grau')).toBeInTheDocument()
  })

  it('turma sem nenhuma data marcada não inventa contagem e manda para a agenda', async () => {
    entrarComo(PAPEIS.comissao)
    responderTurma({ ...turma, previsao_de_colacao: null, previsao_da_festa: null })
    responderAgenda([])
    renderizar(<PaginaInicial />)
    expect(await screen.findByRole('link', { name: 'Marcar agora' })).toHaveAttribute('href', '/agenda')
    expect(screen.queryByText('Contagem regressiva')).not.toBeInTheDocument()
    expect(await screen.findByText(/Nenhuma data marcada/)).toBeInTheDocument()
  })

  it('não oferece edição de datas para formando e não conta dias negativos', async () => {
    responderTurma({ ...turma, previsao_de_colacao: '2020-12-17', previsao_da_festa: '2020-12-19' })
    renderizar(<PaginaInicial />)
    expect(await screen.findByText('Fica na memória')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Marcar agora' })).not.toBeInTheDocument()
    expect(screen.queryByText('Contagem regressiva')).not.toBeInTheDocument()
  })

  it('mostra falha de consulta sem afirmar que o usuário está em dia', async () => {
    servidor.use(
      http.get(`${base}/api/v1/extrato/eu`, () =>
        HttpResponse.json({ mensagem: 'Falha ao consultar parcelas' }, { status: 500 }),
      ),
    )
    renderizar(<PaginaInicial />)
    const parcela = await screen.findByRole('region', { name: 'Sua próxima parcela' })
    expect(await within(parcela).findByRole('alert')).toBeInTheDocument()
    expect(within(parcela).queryByText(/Você está em dia/)).not.toBeInTheDocument()
  })
})
