import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { parcelaDeTeste, vencidaDeTeste } from '@/features/pagamentos/dadosDeTeste'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, pagina, PLANO_ESSENCIAL, PLANO_GRATUITO, renderizar } from '@/test/utils'
import { PaginaInicial } from './PaginaInicial'
import { enqueteDeTeste } from '@/features/enquetes/dadosDeTeste'

const base = env.VITE_API_URL
const turma = {
  id: 'f-1',
  nome: 'Odontologia 2027',
  curso: 'Odontologia',
  instituicao: 'UFPR',
  status: 'Ativa',
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
      http.get(`${base}/api/v1/enquetes`, () => HttpResponse.json([])),
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

  it('apresenta as datas reais e mantém os atalhos pessoais vazios', async () => {
    renderizar(<PaginaInicial />)
    const jornada = await screen.findByRole('region', { name: 'Sua jornada até a formatura' })
    expect(within(jornada).getByText('dias para a festa')).toBeInTheDocument()
    // A mesma data no contador e no bloco de dia da lista de próximas — a segunda vem da agenda.
    expect(within(jornada).getByText('19/12/2099')).toBeInTheDocument()
    const proximas = await screen.findByRole('list', { name: 'Próximas datas da turma' })
    expect(within(proximas).getByText('19')).toBeInTheDocument()
    expect(within(proximas).getByText('Festa de formatura')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver agenda' })).toHaveAttribute('href', '/agenda')
    expect(await screen.findByText('Nenhuma parcela em aberto')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'O dinheiro da turma' })).not.toBeInTheDocument()
    expect(await screen.findByText('Nenhuma enquete publicada')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Recados' })).not.toBeInTheDocument())
  })

  it('mostra os recados quando há aviso fixado', async () => {
    servidor.use(
      http.get(`${base}/api/v1/comunicacao/avisos`, () =>
        HttpResponse.json(
          pagina([{ id: 'a-1', titulo: 'Reunião geral', autor: null, publicado_em: '2099-01-01T10:00:00' }]),
        ),
      ),
    )
    renderizar(<PaginaInicial />)
    const recados = await screen.findByRole('region', { name: 'Recados' })
    expect(within(recados).getByText('Reunião geral')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver o mural' })).toHaveAttribute('href', '/mural')
  })

  it.each([
    { caso: 'série vazia', meses: [] },
    {
      caso: 'valores zerados',
      meses: ARRECADACAO.map((mes) => ({ ...mes, arrecadado_em_centavos: 0 })),
    },
    {
      caso: 'apenas previsão de recebimentos',
      meses: ARRECADACAO.map((mes) => ({
        ...mes,
        arrecadado_em_centavos: mes.projetado ? 9_500_000 : 0,
      })),
    },
  ])('não desenha o gráfico sem arrecadação realizada: $caso', async ({ meses }) => {
    servidor.use(http.get(`${base}/api/v1/financeiro/caixa/arrecadacao`, () => HttpResponse.json(meses)))
    renderizar(<PaginaInicial />)
    await screen.findByRole('list', { name: 'Próximas datas da turma' })
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Evolução das arrecadações' })).not.toBeInTheDocument(),
    )
  })

  it('mantém parcelas e enquetes vazias com mensagens e links de acesso', async () => {
    responderAgenda([])
    servidor.use(http.get(`${base}/api/v1/financeiro/caixa/arrecadacao`, () => HttpResponse.json([])))
    renderizar(<PaginaInicial />)
    await screen.findByRole('region', { name: 'Sua jornada até a formatura' })

    await waitFor(() => {
      for (const nome of ['Evolução das arrecadações', 'Próximas datas', 'Recados']) {
        expect(screen.queryByRole('region', { name: nome })).not.toBeInTheDocument()
      }
    })
    expect(await screen.findByText('Nenhuma enquete publicada')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Pagar parcela' })).not.toBeInTheDocument()
    expect(screen.getByText('Nenhuma parcela em aberto')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver parcelas' })).toHaveAttribute('href', '/minhas-parcelas')
    expect(screen.getByRole('link', { name: 'Ver enquetes' })).toHaveAttribute('href', '/enquetes')
    expect(screen.queryByRole('link', { name: 'Ver agenda' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ver o mural' })).not.toBeInTheDocument()
  })

  it('destaca o voto pendente e abre a enquete pelo atalho', async () => {
    servidor.use(http.get(`${base}/api/v1/enquetes`, () => HttpResponse.json([enqueteDeTeste()])))
    const { router } = renderizar(<PaginaInicial />)
    const bloco = await screen.findByRole('region', { name: 'Enquetes da turma' })
    const votar = await within(bloco).findByRole('link', { name: 'Votar na enquete' })
    expect(within(bloco).getByText('Você ainda não votou.')).toBeInTheDocument()
    expect(within(bloco).queryByRole('link', { name: 'Ver resultado' })).not.toBeInTheDocument()
    await userEvent.setup().click(votar)
    expect(router.state.location.pathname).toBe('/enquetes/e-1')
  })

  it.each([
    { caso: 'pessoa sem permissão para responder', podeResponder: false, status: 'Ativa' },
    { caso: 'turma em modo de leitura', podeResponder: true, status: 'Suspensa' },
  ])('não oferece votação para $caso', async ({ podeResponder, status }) => {
    responderTurma({ ...turma, status })
    servidor.use(
      http.get(`${base}/api/v1/enquetes`, () =>
        HttpResponse.json([enqueteDeTeste({ pode_responder: podeResponder })]),
      ),
    )
    renderizar(<PaginaInicial />)
    const bloco = await screen.findByRole('region', { name: 'Enquetes da turma' })
    expect(await within(bloco).findByRole('link', { name: 'Ver resultado' })).toHaveAttribute(
      'href',
      '/enquetes/e-1',
    )
    expect(within(bloco).queryByRole('link', { name: 'Votar na enquete' })).not.toBeInTheDocument()
  })

  it('mostra apenas a aberta mais recente ao lado da parcela, mesmo respondida', async () => {
    servidor.use(
      http.get(`${base}/api/v1/enquetes`, () =>
        HttpResponse.json([
          enqueteDeTeste({ id: 'antiga', pergunta: 'Consulta antiga', criado_em: '2026-10-10T12:00:00Z' }),
          enqueteDeTeste({ id: 'nova', pergunta: 'Consulta nova', minha_resposta: ['o-1'] }),
        ]),
      ),
      http.get(`${base}/api/v1/extrato/eu/proximas`, () =>
        HttpResponse.json({ proxima: parcelaDeTeste(), seguinte: null }),
      ),
    )
    renderizar(<PaginaInicial />)
    const bloco = await screen.findByRole('region', { name: 'Enquetes da turma' })
    expect(await within(bloco).findByText('Consulta nova')).toBeInTheDocument()
    expect(within(bloco).queryByText('Consulta antiga')).not.toBeInTheDocument()
    expect(within(bloco).getByRole('link', { name: 'Ver resultado' })).toHaveAttribute(
      'href',
      '/enquetes/nova',
    )
    expect(within(bloco).getByRole('link', { name: 'Ver enquetes' })).toHaveAttribute('href', '/enquetes')
    expect(within(bloco).queryByRole('link', { name: 'Votar na enquete' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Sua parcela' }).parentElement).toBe(bloco.parentElement)
    expect(screen.queryByRole('region', { name: 'O dinheiro da turma' })).not.toBeInTheDocument()
  })

  it('sem abertas mostra o último resultado e ignora canceladas', async () => {
    servidor.use(
      http.get(`${base}/api/v1/enquetes`, () =>
        HttpResponse.json([
          enqueteDeTeste({ situacao: 'Cancelada', pergunta: 'Consulta cancelada' }),
          enqueteDeTeste({
            id: 'fim',
            situacao: 'Encerrada',
            pergunta: 'Resultado da consulta',
            pode_responder: false,
            encerrada_em: '2026-10-11T12:00:00Z',
          }),
        ]),
      ),
    )
    renderizar(<PaginaInicial />)
    const bloco = await screen.findByRole('region', { name: 'Enquetes da turma' })
    expect(await within(bloco).findByText('Resultado da consulta')).toBeInTheDocument()
    expect(within(bloco).queryByText('Consulta cancelada')).not.toBeInTheDocument()
    expect(within(bloco).getByRole('link', { name: 'Ver resultado' })).toHaveAttribute(
      'href',
      '/enquetes/fim',
    )
    expect(within(bloco).queryByRole('link', { name: 'Votar na enquete' })).not.toBeInTheDocument()
  })

  it('permite tentar de novo quando a agenda falha e volta a mostrar as datas', async () => {
    let falhar = true
    servidor.use(
      http.get(`${base}/api/v1/agenda/resumo`, () => {
        return falhar
          ? HttpResponse.json({ mensagem: 'Falha ao consultar agenda' }, { status: 500 })
          : HttpResponse.json({ proximos: [festaNaAgenda] })
      }),
    )
    const user = userEvent.setup()
    renderizar(<PaginaInicial />)
    const datas = await screen.findByRole('region', { name: 'Próximas datas' })
    expect(await within(datas).findByRole('alert')).toBeInTheDocument()
    falhar = false
    await user.click(within(datas).getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByText('Festa de formatura')).toBeInTheDocument()
  })

  it.each([PAPEIS.presidente, PAPEIS.formando])(
    'no Essencial, %s vê só os recursos incluídos no plano',
    async (papel) => {
      entrarComo(papel)
      renderizar(<PaginaInicial />, '/', '*', PLANO_ESSENCIAL)

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

    expect(await screen.findByRole('list', { name: 'Próximas datas da turma' })).toBeInTheDocument()
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
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Próximas datas' })).not.toBeInTheDocument(),
    )
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
