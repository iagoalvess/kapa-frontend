import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, pagina, renderizar } from '@/test/utils'
import type { Aviso, ResumoDoMural } from '../types/comunicacao.types'
import MuralPage from './MuralPage'

const AVISOS = `${env.VITE_API_URL}/api/v1/comunicacao/avisos`
const FORMATURA = `${env.VITE_API_URL}/api/v1/formaturas/atual`

const fixado: Aviso = {
  id: 'av-1',
  titulo: 'Contrato do buffet assinado',
  conteudo: 'O **buffet** está fechado.',
  visibilidade: 'Turma',
  fixado: true,
  destaque: true,
  publicado_em: '2026-09-10T12:00:00Z',
  atualizado_em: '2026-09-10T12:00:00Z',
  publicado_por_usuario_id: 'u-1',
  autor: 'Ana Presidente',
}

const interno: Aviso = {
  ...fixado,
  id: 'av-2',
  titulo: 'Ata da reunião interna',
  conteudo: 'Só a comissão.',
  visibilidade: 'SomenteComissao',
  fixado: false,
  destaque: false,
}

const resumo: ResumoDoMural = {
  quantidade: 2,
  fixados: 1,
  importantes: 1,
  internos: 1,
  ultima_publicacao: '2026-09-10T12:00:00Z',
}

/** As consultas da tela. Devolve a URL de cada listagem, que é onde o filtro aparece. */
function comApi(avisos: Aviso[] = [fixado, interno]) {
  const pedidos: URL[] = []

  servidor.use(
    http.get(AVISOS, ({ request }) => {
      pedidos.push(new URL(request.url))
      return HttpResponse.json(pagina(avisos, 20))
    }),
    http.get(`${AVISOS}/resumo`, () => HttpResponse.json(resumo)),
    http.get(FORMATURA, () => HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' })),
  )

  return pedidos
}

/** O cartão do aviso aberto, à direita da lista. */
const detalhe = (titulo: string) => screen.findByRole('region', { name: new RegExp(titulo) })

describe('MuralPage', () => {
  afterEach(() => sessao.encerrar())

  it('sem id na rota, abre o primeiro da lista com autor, selos e texto', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<MuralPage />)

    const cartao = await detalhe('Contrato do buffet assinado')
    expect(within(cartao).getByText('Fixado')).toBeInTheDocument()
    expect(within(cartao).getByText('Importante')).toBeInTheDocument()
    expect(within(cartao).getByText('Ana Presidente')).toBeInTheDocument()
    expect(within(cartao).getByText(/está fechado/)).toBeInTheDocument()

    const lista = screen.getByRole('region', { name: 'Avisos' })
    expect(within(lista).getByRole('link', { name: /Contrato do buffet assinado/ })).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(within(lista).getByRole('link', { name: /Ata da reunião interna/ })).toHaveTextContent(
      'Só comissão',
    )
  })

  it('com o id na rota, abre aquele aviso', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<MuralPage />, '/mural/av-2', '/mural/:id')

    expect(await detalhe('Ata da reunião interna')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /Contrato do buffet/ })).not.toBeInTheDocument()
  })

  it('a pílula e a busca viram filtro na chamada da API', async () => {
    entrarComo('Comissao')
    const pedidos = comApi()

    renderizar(<MuralPage />)

    await userEvent.click(await screen.findByRole('button', { name: /Fixados/ }))
    await waitFor(() => expect(pedidos.at(-1)?.searchParams.get('fixado')).toBe('true'))

    await userEvent.type(screen.getByLabelText('Buscar aviso'), 'buffet{enter}')
    await waitFor(() => expect(pedidos.at(-1)?.searchParams.get('busca')).toBe('buffet'))
  })

  it('o formando lê o mural, mas não vê "Novo" nem o filtro da comissão', async () => {
    entrarComo('Formando')
    comApi([fixado])

    renderizar(<MuralPage />)

    await detalhe('Contrato do buffet assinado')
    expect(screen.queryByRole('button', { name: /Novo/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Só comissão/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('publicar exige escolher para quem é, e envia o que a comissão escreveu', async () => {
    entrarComo('Comissao')
    comApi([])
    let publicado: unknown
    servidor.use(
      http.post(AVISOS, async ({ request }) => {
        publicado = await request.json()
        return HttpResponse.json({ ...fixado, id: 'av-9' }, { status: 201 })
      }),
    )

    renderizar(<MuralPage />)
    await userEvent.click(await screen.findByRole('button', { name: /Novo/ }))

    await userEvent.type(screen.getByLabelText('Título'), 'Reunião na quinta')
    await userEvent.type(screen.getByRole('textbox', { name: 'Texto' }), 'Pauta: **buffet**')
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))

    expect(await screen.findByText('Escolha para quem é.')).toBeInTheDocument()
    expect(publicado).toBeUndefined()

    await userEvent.selectOptions(screen.getByLabelText('Para quem é'), 'SomenteComissao')
    await userEvent.click(screen.getByLabelText('Fixar no topo do mural'))
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))

    await waitFor(() =>
      expect(publicado).toEqual({
        titulo: 'Reunião na quinta',
        conteudo: 'Pauta: **buffet**',
        visibilidade: 'SomenteComissao',
        fixado: true,
        destaque: false,
      }),
    )
  })

  it('editar abre o editor com o texto do aviso aberto', async () => {
    entrarComo('Comissao')
    comApi()

    renderizar(<MuralPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))

    expect(screen.getByLabelText('Título')).toHaveValue('Contrato do buffet assinado')
  })

  it('excluir confirma antes e chama a API', async () => {
    entrarComo('Presidente')
    comApi()
    let excluido: string | undefined
    servidor.use(
      http.delete(`${AVISOS}/:id`, ({ params }) => {
        excluido = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderizar(<MuralPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(excluido).toBe('av-1'))
  })

  it('o quarto fixado mostra a recusa da API junto do botão', async () => {
    entrarComo('Presidente')
    comApi([])
    servidor.use(
      http.post(AVISOS, () =>
        HttpResponse.json(
          {
            status: 409,
            codigo: 'comunicacao.limite_de_fixados',
            detail: 'Já há 3 avisos fixados. Desafixe um antes de fixar outro.',
          },
          { status: 409 },
        ),
      ),
    )

    renderizar(<MuralPage />, '/mural?novo=1')

    await userEvent.type(await screen.findByLabelText('Título'), 'Mais um fixado')
    await userEvent.type(screen.getByRole('textbox', { name: 'Texto' }), 'Texto')
    await userEvent.selectOptions(screen.getByLabelText('Para quem é'), 'Turma')
    await userEvent.click(screen.getByLabelText('Fixar no topo do mural'))
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Já há 3 avisos fixados')
  })
})
