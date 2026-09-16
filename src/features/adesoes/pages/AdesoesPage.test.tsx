import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PERFIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { pagina, renderizar } from '@/test/utils'
import type { SituacaoDeAdesao } from '../types/adesoes.types'
import AdesoesPage from './AdesoesPage'

const BASE = `${env.VITE_API_URL}/api/v1/adesoes`

/** Como a API devolve: quem não aderiu vem sem `adesao_id`, `versao` e `aceito_em` (`WhenWritingNull`). */
const ana: SituacaoDeAdesao = {
  usuario_id: 'u-1',
  nome: 'Ana Souza',
  email: 'ana@kapa.dev',
  papel: 'Formando',
  adesao_id: 'ad-1',
  versao: 2,
  aceito_em: '2026-09-14T13:32:05Z',
}
const bruno: SituacaoDeAdesao = {
  usuario_id: 'u-2',
  nome: 'Bruno Lima',
  email: 'bruno@kapa.dev',
  papel: 'Formando',
}
const carla: SituacaoDeAdesao = {
  ...ana,
  usuario_id: 'u-3',
  nome: 'Carla Dias',
  adesao_id: 'ad-3',
  versao: 1,
}

function responder() {
  const pedidos: URLSearchParams[] = []
  const lembrados: string[] = []
  servidor.use(
    http.get(`${BASE}/termos/vigente`, () =>
      HttpResponse.json({
        termo: { id: 't-2', versao: 2, conteudo: '# Termo', vigente_desde: '2026-09-14T12:00:00Z' },
      }),
    ),
    http.get(`${BASE}/resumo`, () => HttpResponse.json({ membros: 80, aderiram: 62, versao_vigente: 2 })),
    http.get(BASE, ({ request }) => {
      pedidos.push(new URL(request.url).searchParams)
      return HttpResponse.json(pagina([ana, bruno, carla]))
    }),
    http.post(`${BASE}/:usuario_id/lembrete`, ({ params }) => {
      lembrados.push(String(params.usuario_id))
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return { pedidos, lembrados }
}

function entrarComo(papel: string) {
  const corpo = {
    sub: 'u-9',
    name: 'Pedro',
    email: 'pedro@kapa.dev',
    role: [PERFIS.usuario],
    formatura_id: 'f-1',
    papel,
  }
  sessao.autenticar({
    access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  })
}

describe('AdesoesPage', () => {
  afterEach(() => sessao.encerrar())

  it('mostra quantos aderiram e a situação de cada um diante da versão vigente', async () => {
    responder()

    renderizar(<AdesoesPage />)

    const faixa = await screen.findByRole('region', { name: 'Resumo das adesões' })
    expect(faixa).toHaveTextContent('62de 80')
    expect(await screen.findByText('Aderiu · v2')).toBeInTheDocument()
    expect(screen.getByText('Falta aderir')).toBeInTheDocument()
    expect(screen.getByText('Na v1')).toBeInTheDocument()
    // O conteúdo veio sem plano: o cartão do termo avisa que ninguém consegue aderir ainda.
    expect(screen.getByText(/ainda não tem plano de cobrança em vigor/)).toBeInTheDocument()
  })

  it('lembra quem falta e quem ficou numa versão anterior, e não quem já aceitou a vigente', async () => {
    const { lembrados } = responder()

    renderizar(<AdesoesPage />)

    expect(await screen.findByRole('button', { name: 'Lembrar Bruno Lima' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lembrar Carla Dias' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lembrar Ana Souza' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Lembrar Bruno Lima' }))

    await waitFor(() => expect(lembrados).toEqual(['u-2']))
    expect(await screen.findByRole('button', { name: 'Lembrar Bruno Lima' })).toHaveTextContent('Lembrado')
  })

  /**
   * Publicar troca a versão vigente, e a releitura remonta o editor: o fechamento tem de acontecer
   * antes disso, senão o editor fica aberto oferecendo a versão seguinte.
   */
  it('o Presidente publica a versão nova e o editor fecha', async () => {
    entrarComo('Presidente')
    responder()
    let vigente = 2
    let publicado: unknown
    servidor.use(
      http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () =>
        HttpResponse.json({ id: 'f-1', status: 'Ativa' }),
      ),
      http.get(`${BASE}/termos`, () => HttpResponse.json([])),
      http.get(`${BASE}/termos/vigente`, () =>
        HttpResponse.json({
          termo: {
            id: `t-${vigente}`,
            versao: vigente,
            conteudo: '# Termo',
            vigente_desde: '2026-09-14T12:00:00Z',
          },
        }),
      ),
      http.post(`${BASE}/termos`, async ({ request }) => {
        publicado = await request.json()
        vigente = 3
        return HttpResponse.json(
          { id: 't-3', versao: 3, conteudo: '# Termo novo', vigente_desde: '2026-09-15T12:00:00Z' },
          { status: 201 },
        )
      }),
    )

    renderizar(<AdesoesPage />, '/?editar=termo')

    const texto = await screen.findByLabelText('Texto do termo')
    await userEvent.clear(texto)
    await userEvent.type(texto, '# Termo novo')
    await userEvent.click(screen.getByRole('button', { name: 'Publicar versão 3' }))
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Publicar' }),
    )

    await waitFor(() => expect(screen.queryByLabelText('Texto do termo')).not.toBeInTheDocument())
    expect(publicado).toEqual({ conteudo: '# Termo novo' })
    expect(await screen.findByRole('region', { name: 'Resumo das adesões' })).toHaveTextContent('Versão 3')
  })

  it('filtra quem falta pela URL', async () => {
    const { pedidos } = responder()

    renderizar(<AdesoesPage />)

    await userEvent.click(await screen.findByRole('button', { name: /Faltam/ }))

    await waitFor(() => expect(pedidos.at(-1)?.get('aderiu')).toBe('false'))
    expect(screen.getByRole('button', { name: /Faltam/ })).toHaveAttribute('aria-pressed', 'true')
  })
})
