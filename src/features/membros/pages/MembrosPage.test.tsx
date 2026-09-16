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
}
const bruno = {
  usuario_id: 'u-2',
  nome: 'Bruno',
  email: 'bruno@exemplo.com',
  papel: 'Formando',
  ativo: true,
  completude: 0,
  essencial_pendente: true,
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

/** Ativos: 1 Presidente e 2 Formandos; removidos: 1 Formando. */
const RESUMO = [
  { papel: 'Presidente', ativo: true, quantidade: 1 },
  { papel: 'Formando', ativo: true, quantidade: 2 },
  { papel: 'Formando', ativo: false, quantidade: 1 },
]

/**
 * Guarda a query string de cada listagem pedida, para conferir o que foi à API. A de `tamanho=1`
 * é a contagem de quem deve o essencial, na faixa: responde à parte e não entra na conta.
 */
function registrarListagens(
  resposta: (url: URL) => ReturnType<typeof pagina> = () => pagina([ana, bruno]),
  pendentes = 1,
) {
  const pedidas: URLSearchParams[] = []
  servidor.use(
    http.get(ATUAL, () => HttpResponse.json({ id: 'f-1', status: 'Ativa' })),
    http.get(`${MEMBROS}/resumo`, () => HttpResponse.json(RESUMO)),
    http.get(MEMBROS, ({ request }) => {
      const url = new URL(request.url)
      if (url.searchParams.get('tamanho') === '1') return HttpResponse.json(pagina([bruno], 1, 1, pendentes))
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
    registrarListagens(() => pagina([{ ...ana, nome_completo: 'Ana Souza' }, bruno]), 7)
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
    expect(await within(faixa).findByText('7')).toBeInTheDocument()
    expect(within(faixa).getByText('pendente')).toBeInTheDocument()
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
})
