import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS, PERFIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import MembrosPage from './MembrosPage'

const ATUAL = `${env.VITE_API_URL}/api/v1/formaturas/atual`
const MEMBROS = `${ATUAL}/membros`

/** Como a API devolve: sem nome civil informado, `nome_completo` não vem (`WhenWritingNull`). */
const ana = {
  usuario_id: 'u-1',
  nome: 'Ana',
  email: 'ana@exemplo.com',
  papel: 'Presidente',
  ativo: true,
  completude: 100,
  essencial_pendente: false,
  tem_adesao: false,
}
const bruno = {
  usuario_id: 'u-2',
  nome: 'Bruno',
  email: 'bruno@exemplo.com',
  papel: 'Formando',
  ativo: true,
  completude: 0,
  essencial_pendente: true,
  tem_adesao: false,
}

function pagina(itens: unknown[], numero = 1, total_paginas = 1, total = total_paginas * 20) {
  return {
    itens,
    pagina: numero,
    tamanho: 20,
    total,
    total_paginas,
    tem_proxima: numero < total_paginas,
  }
}

function entrarComo(papel: string) {
  const corpo = {
    sub: 'u-1',
    name: 'Ana',
    email: 'ana@exemplo.com',
    role: [PERFIS.usuario],
    formatura_id: 'f-1',
    papel,
  }
  sessao.autenticar({
    access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  })
}

/**
 * Ativos: 1 Presidente e 2 Formandos; removidos: 1 Formando. Nenhum desligado.
 *
 * O cadastro pendente é mais uma dimensão do agrupamento, e por isso divide a linha dos formandos
 * ativos em vez de somar a ela — é assim que a API responde, e é o que faz o número da faixa e o
 * das pílulas saírem do mesmo resumo. Grupo vazio não vem: um `GROUP BY` não devolve zero.
 */
const resumo = (pendentes: number) =>
  [
    { papel: 'Presidente', ativo: true, desligado: false, essencial_pendente: false, quantidade: 1 },
    { papel: 'Formando', ativo: true, desligado: false, essencial_pendente: true, quantidade: pendentes },
    {
      papel: 'Formando',
      ativo: true,
      desligado: false,
      essencial_pendente: false,
      quantidade: 2 - pendentes,
    },
    { papel: 'Formando', ativo: false, desligado: false, essencial_pendente: false, quantidade: 1 },
  ].filter((contagem) => contagem.quantidade > 0)

/** Guarda a query string de cada listagem pedida, para conferir o que foi à API. */
function registrarListagens(
  resposta: (url: URL) => ReturnType<typeof pagina> = () => pagina([ana, bruno]),
  pendentes = 1,
) {
  const pedidas: URLSearchParams[] = []
  servidor.use(
    http.get(ATUAL, () => HttpResponse.json({ id: 'f-1', status: 'Ativa' })),
    http.get(`${MEMBROS}/resumo`, () => HttpResponse.json(resumo(pendentes))),
    http.get(MEMBROS, ({ request }) => {
      const url = new URL(request.url)
      pedidas.push(url.searchParams)
      return HttpResponse.json(resposta(url))
    }),
  )
  return pedidas
}

describe('MembrosPage', () => {
  afterEach(() => sessao.encerrar())

  it('Comissão vê a lista, sem os controles do Presidente', async () => {
    registrarListagens()
    entrarComo(PAPEIS.comissao)

    renderizar(<MembrosPage />)

    expect(await screen.findByText('Bruno')).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /Papel de/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remover' })).not.toBeInTheDocument()
  })

  /** Suspensa é leitura: a lista continua, os controles do Presidente ficam desabilitados. */
  it('com a formatura suspensa, o Presidente vê a lista com os controles desabilitados', async () => {
    registrarListagens()
    servidor.use(http.get(ATUAL, () => HttpResponse.json({ id: 'f-1', status: 'Suspensa' })))
    entrarComo(PAPEIS.presidente)

    renderizar(<MembrosPage />)

    expect(await screen.findByText('Bruno')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Papel de Bruno' })).toBeDisabled())
    for (const botao of screen.getAllByRole('button', { name: 'Remover' })) expect(botao).toBeDisabled()
  })

  it('pede só os ativos, na página da URL, e avança pela paginação', async () => {
    const pedidas = registrarListagens((url) => pagina([bruno], Number(url.searchParams.get('pagina')), 3))
    entrarComo(PAPEIS.presidente)

    renderizar(<MembrosPage />, '/?pagina=2')

    expect(await screen.findByText('Página 2 de 3 · 60 no total')).toBeInTheDocument()
    // Quantos a página mostra, e não o total do filtro.
    expect(screen.getByText('Mostrando 1 de 60 membros')).toBeInTheDocument()
    expect(pedidas[0]?.get('pagina')).toBe('2')
    expect(pedidas[0]?.get('ativo')).toBe('true')

    await userEvent.click(screen.getByRole('button', { name: /Próxima/ }))

    expect(await screen.findByText('Página 3 de 3 · 60 no total')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Próxima/ })).toBeDisabled()
  })

  it('a busca e a situação vão para a API e voltam à primeira página', async () => {
    const pedidas = registrarListagens()
    entrarComo(PAPEIS.presidente)

    renderizar(<MembrosPage />, '/?pagina=4')
    await screen.findByText('Bruno')

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar membro' }), 'bru')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    await waitFor(() => expect(pedidas.at(-1)?.get('busca')).toBe('bru'))
    expect(pedidas.at(-1)?.get('pagina')).toBe('1')

    await userEvent.click(screen.getByRole('button', { name: /^Todos/ }))
    await waitFor(() => expect(pedidas.at(-1)?.has('ativo')).toBe(false))
    expect(pedidas.at(-1)?.get('busca')).toBe('bru')
  })

  /**
   * O número na pílula é o que a lista traz ao clicar: as contagens de papel seguem a situação
   * escolhida, e as de situação seguem o papel.
   */
  it('filtra por papel, e as contagens acompanham o outro filtro', async () => {
    const pedidas = registrarListagens()
    entrarComo(PAPEIS.presidente)

    renderizar(<MembrosPage />)

    const formando = await screen.findByRole('button', { name: 'Formando 2' })
    expect(screen.getByRole('button', { name: 'Removidos 1' })).toBeInTheDocument()

    await userEvent.click(formando)
    await waitFor(() => expect(pedidas.at(-1)?.get('papel')).toBe('Formando'))
    expect(screen.getByRole('button', { name: 'Formando 2' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Todos 3' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^Removidos/ }))
    expect(await screen.findByRole('button', { name: 'Formando 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Presidente 0' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Formando 1' }))
    await waitFor(() => expect(pedidas.at(-1)?.has('papel')).toBe(false))
  })

  /** O nome civil, quando informado, identifica melhor que o da conta — e abre o cadastro. */
  it('mostra o cadastro de cada um, com o nome abrindo o detalhe', async () => {
    registrarListagens(() => pagina([{ ...ana, nome_completo: 'Ana Souza' }, bruno]), 2)
    entrarComo(PAPEIS.comissao)

    renderizar(<MembrosPage />)

    expect(await screen.findByRole('link', { name: 'Ana Souza' })).toHaveAttribute(
      'href',
      '/formatura/membros/u-1',
    )
    const linhaDeBruno = screen.getByRole('link', { name: 'Bruno' }).closest('tr')!
    expect(within(linhaDeBruno).getByText('0%')).toBeInTheDocument()
    expect(within(linhaDeBruno).getByText('Falta o essencial')).toBeInTheDocument()
    expect(screen.getByText('Completo')).toBeInTheDocument()

    const faixa = screen.getByRole('region', { name: 'Resumo dos membros' })
    // Pelo indicador, e não pelo texto solto: `2` também é o número de formandos, ao lado.
    const semEssencial = (await within(faixa).findByText('Sem o essencial')).closest('dl')!
    expect(within(semEssencial).getByText('2')).toBeInTheDocument()
    expect(within(semEssencial).getByText('pendente')).toBeInTheDocument()
  })

  /** Removido não tem cadastro para abrir: a API só mostra o de quem ainda está na turma. */
  it('removido aparece sem link para o cadastro', async () => {
    registrarListagens(() => pagina([{ ...bruno, ativo: false }]))
    entrarComo(PAPEIS.comissao)

    renderizar(<MembrosPage />, '/?situacao=removidos')

    expect(await screen.findByText('Bruno')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Bruno' })).not.toBeInTheDocument()
  })

  /**
   * O filtro de cadastro mora no painel "Filtros", fechado por padrão — com ele fechado, o número
   * no botão é o que diz que há filtro ligado. O jsdom esconde `popover` mas não sabe abri-lo, então
   * o filtro entra pela URL, como num link compartilhado.
   */
  it('filtra pela situação do cadastro, somando aos outros filtros, e o botão conta o filtro ligado', async () => {
    const pedidas = registrarListagens()
    entrarComo(PAPEIS.comissao)

    const { unmount } = renderizar(<MembrosPage />, '/?papel=Formando')
    await screen.findByText('Bruno')
    expect(screen.getByRole('button', { name: 'Filtros' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Falta o essencial' })).not.toBeInTheDocument()
    unmount()

    renderizar(<MembrosPage />, '/?papel=Formando&cadastro=Pendente')
    await waitFor(() => expect(pedidas.at(-1)?.get('cadastro')).toBe('Pendente'))
    expect(pedidas.at(-1)?.get('papel')).toBe('Formando')
    expect(await screen.findByRole('button', { name: 'Filtros 1' })).toBeInTheDocument()
  })

  it('Presidente troca o papel de outra pessoa direto pelo seletor', async () => {
    let enviado: unknown
    registrarListagens()
    servidor.use(
      http.put(`${MEMBROS}/u-2/papel`, async ({ request }) => {
        enviado = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    entrarComo(PAPEIS.presidente)

    renderizar(<MembrosPage />)
    await userEvent.selectOptions(await screen.findByLabelText('Papel de Bruno'), 'Tesoureiro')

    await waitFor(() => expect(enviado).toEqual({ papel: 'Tesoureiro' }))
  })

  /** Deixar a presidência tira o próprio acesso: não pode acontecer num clique distraído. */
  it('pede confirmação antes de o Presidente deixar a própria presidência', async () => {
    let chamou = false
    registrarListagens()
    servidor.use(
      http.put(`${MEMBROS}/u-1/papel`, () => {
        chamou = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    entrarComo(PAPEIS.presidente)

    renderizar(<MembrosPage />)
    await userEvent.selectOptions(await screen.findByLabelText('Papel de Ana'), 'Formando')

    const dialogo = await screen.findByRole('alertdialog', { name: 'Deixar a presidência?' })
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    expect(chamou).toBe(false)
  })

  it('remove só depois de confirmar no diálogo', async () => {
    let removido = false
    registrarListagens()
    servidor.use(
      http.delete(`${MEMBROS}/u-2`, () => {
        removido = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    entrarComo(PAPEIS.presidente)

    renderizar(<MembrosPage />)
    const linha = (await screen.findByText('Bruno')).closest('tr')!
    await userEvent.click(within(linha).getByRole('button', { name: 'Remover' }))

    const dialogo = await screen.findByRole('alertdialog', { name: 'Remover Bruno?' })
    expect(removido).toBe(false)
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Remover' }))

    await waitFor(() => expect(removido).toBe(true))
  })

  /**
   * Decisão 1: quem aderiu deve, e sai por Desligar; quem não aderiu é erro de cadastro, e sai por
   * Remover. Duas portas para o mesmo estado, com efeitos diferentes sobre dinheiro, é como alguém
   * apaga uma dívida sem querer.
   */
  it('oferece Desligar a quem tem adesão e Remover a quem não tem', async () => {
    registrarListagens(() => pagina([ana, { ...bruno, tem_adesao: true }]))
    entrarComo(PAPEIS.presidente)

    renderizar(<MembrosPage />)

    const linhaDeBruno = (await screen.findByText('Bruno')).closest('tr')!
    expect(within(linhaDeBruno).getByRole('button', { name: 'Desligar' })).toBeInTheDocument()
    expect(within(linhaDeBruno).queryByRole('button', { name: 'Remover' })).not.toBeInTheDocument()

    const linhaDeAna = screen.getByText('Ana').closest('tr')!
    expect(within(linhaDeAna).getByRole('button', { name: 'Remover' })).toBeInTheDocument()
    expect(within(linhaDeAna).queryByRole('button', { name: 'Desligar' })).not.toBeInTheDocument()
  })

  /** Os números do resumo vêm antes da escolha do motivo: desligar sem vê-los é assinar em branco. */
  it('mostra o que será cancelado e manda motivo e a escolha sobre o atraso', async () => {
    let corpo: unknown = null
    registrarListagens(() => pagina([{ ...bruno, tem_adesao: true }]))
    servidor.use(
      http.get(`${MEMBROS}/u-2/resumo-da-saida`, () =>
        HttpResponse.json({
          nome: 'Bruno',
          tem_adesao: true,
          ja_pago_em_centavos: 420_000,
          parcelas_em_aberto: 14,
          em_aberto_em_centavos: 630_000,
          parcelas_em_atraso: 2,
          em_atraso_em_centavos: 90_000,
        }),
      ),
      http.post(`${MEMBROS}/u-2/desligar`, async ({ request }) => {
        corpo = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    entrarComo(PAPEIS.presidente)

    renderizar(<MembrosPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Desligar' }))

    const dialogo = await screen.findByRole('alertdialog', { name: 'Desligar Bruno da turma?' })
    expect(await within(dialogo).findByText('R$ 4.200,00')).toBeInTheDocument()
    expect(within(dialogo).getByText('(14 parcelas)')).toBeInTheDocument()

    await userEvent.selectOptions(within(dialogo).getByLabelText('Motivo da saída'), 'DificuldadeFinanceira')
    await userEvent.click(within(dialogo).getByRole('checkbox'))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Desligar' }))

    await waitFor(() => expect(corpo).toEqual({ motivo: 'DificuldadeFinanceira', cancelar_atraso: true }))
  })

  /** "Outro" sem justificativa não sai da tela: dois anos depois, é a resposta que alguém vai pedir. */
  it('exige a justificativa quando o motivo é Outro', async () => {
    let chamou = false
    registrarListagens(() => pagina([{ ...bruno, tem_adesao: true }]))
    servidor.use(
      http.get(`${MEMBROS}/u-2/resumo-da-saida`, () =>
        HttpResponse.json({
          nome: 'Bruno',
          tem_adesao: true,
          ja_pago_em_centavos: 0,
          parcelas_em_aberto: 3,
          em_aberto_em_centavos: 90_000,
          parcelas_em_atraso: 0,
          em_atraso_em_centavos: 0,
        }),
      ),
      http.post(`${MEMBROS}/u-2/desligar`, () => {
        chamou = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    entrarComo(PAPEIS.presidente)

    renderizar(<MembrosPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Desligar' }))

    const dialogo = await screen.findByRole('alertdialog', { name: 'Desligar Bruno da turma?' })
    // Sem atraso não há o que cancelar, e a caixa nem aparece.
    expect(within(dialogo).queryByRole('checkbox')).not.toBeInTheDocument()

    await userEvent.selectOptions(within(dialogo).getByLabelText('Motivo da saída'), 'Outro')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Desligar' }))

    expect(await within(dialogo).findByText('Diga qual foi o motivo.')).toBeInTheDocument()
    expect(chamou).toBe(false)
  })

  /** Ele não some da lista — sumir esconderia o histórico de quem pagou parte —, e dá para desfazer. */
  it('desligado fica na lista com selo próprio e oferece Religar', async () => {
    let religou = false
    const desligado = {
      ...bruno,
      ativo: false,
      tem_adesao: true,
      desligado_em: '2026-09-16T12:00:00Z',
      motivo_do_desligamento: 'Trancamento',
    }
    registrarListagens(() => pagina([desligado]))
    servidor.use(
      http.post(`${MEMBROS}/u-2/religar`, () => {
        religou = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    entrarComo(PAPEIS.presidente)

    renderizar(<MembrosPage />)

    const linha = (await screen.findByText('Bruno')).closest('tr')!
    expect(within(linha).getByText('Desligado')).toBeInTheDocument()
    expect(within(linha).queryByRole('button', { name: 'Desligar' })).not.toBeInTheDocument()

    await userEvent.click(within(linha).getByRole('button', { name: 'Religar' }))
    const dialogo = await screen.findByRole('alertdialog', { name: 'Religar Bruno?' })
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Religar' }))

    await waitFor(() => expect(religou).toBe(true))
  })

  /** A pílula nova é um filtro à parte: desligado e removido compartilham `ativo=false`. */
  it('o filtro Desligados vai para a API separado de Removidos', async () => {
    const pedidas = registrarListagens()
    entrarComo(PAPEIS.presidente)

    renderizar(<MembrosPage />)
    await screen.findByText('Bruno')

    await userEvent.click(screen.getByRole('button', { name: /^Desligados/ }))
    await waitFor(() => expect(pedidas.at(-1)?.get('desligado')).toBe('true'))
    expect(pedidas.at(-1)?.get('ativo')).toBe('false')

    await userEvent.click(screen.getByRole('button', { name: /^Removidos/ }))
    await waitFor(() => expect(pedidas.at(-1)?.get('desligado')).toBe('false'))
    expect(pedidas.at(-1)?.get('ativo')).toBe('false')
  })
})
