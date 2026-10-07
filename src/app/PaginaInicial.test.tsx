import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { parcelaDeTeste, vencidaDeTeste } from '@/features/pagamentos/dadosDeTeste'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, pagina, PLANO_ESSENCIAL, PLANO_GRATUITO, renderizar } from '@/test/utils'
import { PaginaInicial } from './PaginaInicial'

const base = env.VITE_API_URL
const turma = {
  id: 'f-1',
  nome: 'Odontologia 2027',
  curso: 'Odontologia',
  instituicao: 'UFPR',
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
  servidor.use(http.get(`${base}/api/v1/agenda/resumo`, () => HttpResponse.json({ proximos })))
}

/** Cinco meses fechados e o próximo previsto, como a API devolve. */
const ARRECADACAO = [
  { mes: '2099-05-01', arrecadado_em_centavos: 3_000_000, projetado: false },
  { mes: '2099-06-01', arrecadado_em_centavos: 4_500_000, projetado: false },
  { mes: '2099-07-01', arrecadado_em_centavos: 6_500_000, projetado: false },
  { mes: '2099-08-01', arrecadado_em_centavos: 6_500_000, projetado: false },
  { mes: '2099-09-01', arrecadado_em_centavos: 7_883_705, projetado: false },
  { mes: '2099-10-01', arrecadado_em_centavos: 9_500_000, projetado: true },
]

describe('Página inicial', () => {
  beforeEach(() => {
    entrarComo(PAPEIS.formando)
    responderTurma(turma)
    responderAgenda([festaNaAgenda])
    servidor.use(
      http.get(`${base}/api/v1/festa/meta`, () =>
        HttpResponse.json({ custo_em_centavos: 0, arrecadado_em_centavos: 0 }),
      ),
      http.get(`${base}/api/v1/financeiro/caixa/arrecadacao`, () => HttpResponse.json(ARRECADACAO)),
      http.get(`${base}/api/v1/extrato/eu/proximas`, () =>
        HttpResponse.json({ proxima: null, seguinte: null }),
      ),
      http.get(`${base}/api/v1/comunicacao/avisos`, () => HttpResponse.json(pagina([]))),
      // O guia de primeiros passos (só a Tesouraria) e a situação da adesão (o aviso do termo).
      http.get(`${base}/api/v1/formaturas/atual/primeiros-passos`, () =>
        HttpResponse.json({
          comissao_montada: false,
          plano_de_cobranca_em_vigor: false,
          termo_publicado: false,
          recebimentos_configurados: false,
          plano_contratado: false,
          formandos_na_turma: false,
          concluidos: false,
        }),
      ),
      http.get(`${base}/api/v1/adesoes/eu/situacao`, () =>
        HttpResponse.json({ termo_publicado: false, plano_vigente: false, aderiu: false }),
      ),
      http.get(`${base}/api/v1/formandos/eu`, () =>
        HttpResponse.json({ essencial_pendente: false, completude: 100 }),
      ),
    )
  })
  afterEach(() => sessao.encerrar())

  it('apresenta as datas reais, o orçamento em preparação e o extrato em dia', async () => {
    renderizar(<PaginaInicial />)
    const jornada = await screen.findByRole('region', { name: 'Sua jornada até a formatura' })
    expect(within(jornada).getByText('dias para a festa')).toBeInTheDocument()
    // A mesma data no contador e no bloco de dia da lista de próximas — a segunda vem da agenda.
    expect(within(jornada).getByText('19/12/2099')).toBeInTheDocument()
    const proximas = await screen.findByRole('list', { name: 'Próximas datas da turma' })
    expect(within(proximas).getByText('19')).toBeInTheDocument()
    expect(within(proximas).getByText('Festa de formatura')).toBeInTheDocument()
    expect(await screen.findByText(/Toda festa começa com uma ideia/)).toBeInTheDocument()
    expect(await screen.findByText(/Você está em dia/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver agenda' })).toHaveAttribute('href', '/agenda')
    expect(await screen.findByRole('region', { name: 'Recados' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver o mural' })).toHaveAttribute('href', '/mural')
  })

  it.each([PAPEIS.presidente, PAPEIS.formando])(
    'no Essencial, %s vê só os recursos incluídos no plano',
    async (papel) => {
      entrarComo(papel)
      renderizar(<PaginaInicial />, '/', '*', PLANO_ESSENCIAL)

      expect(await screen.findByText(/Você está em dia/)).toBeInTheDocument()
      expect(await screen.findByRole('list', { name: 'Próximas datas da turma' })).toBeInTheDocument()
      expect(screen.queryByRole('region', { name: 'Recados' })).not.toBeInTheDocument()
      expect(screen.queryByRole('region', { name: 'O dinheiro da turma' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Ver o mural' })).not.toBeInTheDocument()
      expect(screen.queryByText(/Mural, documentos e o orçamento/)).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Ver planos' })).not.toBeInTheDocument()
    },
  )

  it('no gratuito, a gestão não vê propaganda dos recursos exclusivos no Início', async () => {
    entrarComo(PAPEIS.presidente)
    renderizar(<PaginaInicial />, '/', '*', PLANO_GRATUITO)

    expect(await screen.findByText(/Você está em dia/)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'O dinheiro da turma' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Recados' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ver planos' })).not.toBeInTheDocument()
  })

  /** O gráfico abre no mês atual — o último que não é previsão —, com o total dele à vista. */
  it('mostra a evolução com o mês atual em destaque e a tabela para o leitor de tela', async () => {
    renderizar(<PaginaInicial />)

    const grafico = await screen.findByRole('region', { name: 'Evolução das arrecadações' })
    expect(await within(grafico).findByText('Setembro')).toBeInTheDocument()
    expect(grafico.querySelector('svg')).toHaveAttribute('viewBox', '0 0 1000 235')
    const tabela = within(grafico).getByRole('table', { name: 'Total arrecadado ao fim de cada mês' })
    expect(within(tabela).getAllByRole('row')).toHaveLength(7)
    expect(within(tabela).getByText(/(previsto)/)).toBeInTheDocument()
  })

  it('mantém o gráfico no celular em um desenho mais estreito', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
    }))

    try {
      renderizar(<PaginaInicial />)

      const grafico = await screen.findByRole('region', { name: 'Evolução das arrecadações' })
      expect(await within(grafico).findByText('Setembro')).toBeInTheDocument()
      expect(grafico.querySelector('svg')).toHaveAttribute('viewBox', '0 0 390 275')
      expect(within(grafico).queryByRole('button')).not.toBeInTheDocument()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('usa a colação quando a turma não tem data da festa', async () => {
    responderTurma({ ...turma, previsao_da_festa: null })
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

  it('a parcela em aberto leva ao PIX daquela parcela', async () => {
    const parcela = vencidaDeTeste()
    const seguinte = parcelaDeTeste({ id: 'pa-seguinte', numero: 3, vencimento: '2026-09-10' })
    servidor.use(
      http.get(`${base}/api/v1/extrato/eu/proximas`, () => HttpResponse.json({ proxima: parcela, seguinte })),
    )
    renderizar(<PaginaInicial />)

    expect(await screen.findByRole('link', { name: 'Pagar parcela' })).toHaveAttribute(
      'href',
      `/minhas-parcelas/parcelas/${parcela.id}/pagar`,
    )
    const parcelaSeguinte = screen.getByRole('complementary', { name: 'Parcela seguinte' })
    expect(within(parcelaSeguinte).getByText('Depois · Mensalidade 3/24')).toBeInTheDocument()
  })

  it('mostra falha de consulta sem afirmar que o usuário está em dia', async () => {
    servidor.use(
      http.get(`${base}/api/v1/extrato/eu/proximas`, () =>
        HttpResponse.json({ mensagem: 'Falha ao consultar parcelas' }, { status: 500 }),
      ),
    )
    renderizar(<PaginaInicial />)
    const parcela = await screen.findByRole('region', { name: 'Sua parcela' })
    expect(await within(parcela).findByRole('alert')).toBeInTheDocument()
    expect(within(parcela).queryByText(/Você está em dia/)).not.toBeInTheDocument()
  })

  it('a comissão nova vê o guia de primeiros passos no topo', async () => {
    entrarComo(PAPEIS.presidente)
    responderTurma({ ...turma, status: 'Ativa', ja_contratou: false })
    renderizar(<PaginaInicial />)

    const guia = await screen.findByRole('region', { name: 'Primeiros passos' })
    expect(within(guia).getByRole('link', { name: 'Monte o plano de cobrança' })).toHaveAttribute(
      'href',
      '/cobrancas',
    )
    // Formando só entra com plano, termo e contratação: até lá o passo aparece, mas trancado.
    expect(within(guia).getByText(/Convide os formandos/)).toBeInTheDocument()
    expect(within(guia).queryByRole('link', { name: 'Convide os formandos' })).not.toBeInTheDocument()
  })

  it('explica que o aceite gera as parcelas e abre o termo disponível', async () => {
    responderTurma({ ...turma, status: 'Ativa' })
    servidor.use(
      http.get(`${base}/api/v1/adesoes/eu/situacao`, () =>
        HttpResponse.json({ termo_publicado: true, plano_vigente: true, aderiu: false }),
      ),
    )
    renderizar(<PaginaInicial />)
    expect(await screen.findByRole('link', { name: 'Ler e aceitar termo' })).toHaveAttribute(
      'href',
      '/meu-termo',
    )
    expect(screen.getByText(/suas parcelas serão geradas/)).toBeInTheDocument()
  })
})
