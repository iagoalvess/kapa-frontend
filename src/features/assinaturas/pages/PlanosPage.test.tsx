import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import PlanosPage from './PlanosPage'

const MODULOS = ['Membros e convites', 'Termo de adesão']

const ESSENCIAL = {
  id: 'p-1',
  codigo: 'essencial',
  nome: 'Essencial',
  descricao: 'Para a turma que está começando.',
  preco_em_centavos: 2990,
  ciclo: 'Mensal',
  limite_de_formandos: 50,
  modulos: MODULOS,
  recomendado: false,
}

const PREMIUM = {
  id: 'p-2',
  codigo: 'premium',
  nome: 'Premium',
  descricao: 'O dia a dia da comissão inteiro.',
  preco_em_centavos: 4990,
  ciclo: 'Mensal',
  limite_de_formandos: 400,
  modulos: [...MODULOS, 'Caixa e relatórios'],
  recomendado: true,
}

const PREMIUM_ANUAL = {
  ...PREMIUM,
  id: 'p-3',
  codigo: 'premium-anual',
  preco_em_centavos: 47900,
  preco_cheio_em_centavos: 59880,
  ciclo: 'Anual',
}

const PLANOS = [ESSENCIAL, PREMIUM, PREMIUM_ANUAL]

function entrarComo(papel: string) {
  const corpo = { sub: 'u-1', name: 'Ana', formatura_id: 'f-1', papel }
  sessao.autenticar({
    access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  })
}

/** @param assinatura A assinatura da turma; ausente, a API responde 404, como antes de contratar. */
function comFormatura(status: string, assinatura?: { status: string; plano: typeof PREMIUM }) {
  servidor.use(
    http.get(`${env.VITE_API_URL}/api/v1/planos`, () => HttpResponse.json(PLANOS)),
    http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () => HttpResponse.json({ id: 'f-1', status })),
    http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual/assinatura`, () =>
      assinatura
        ? HttpResponse.json({
            id: 'a-1',
            meio: 'Cartao',
            proximo_plano: null,
            cartao_aguardando_autorizacao: false,
            ...assinatura,
          })
        : HttpResponse.json(
            { codigo: 'assinatura.nao_encontrada', message: 'Não encontrada.' },
            { status: 404 },
          ),
    ),
  )
}

describe('PlanosPage', () => {
  afterEach(() => {
    sessao.encerrar()
    globalThis.location.hash = ''
  })

  /** A URL devolvida é só um âncora aqui: o jsdom navega por hash, e é assim que dá para ver a ida ao provedor. */
  it('o Presidente contrata e vai para a página do provedor', async () => {
    entrarComo(PAPEIS.presidente)
    comFormatura('Rascunho')
    let pedido: unknown
    servidor.use(
      http.post(`${env.VITE_API_URL}/api/v1/formaturas/atual/assinatura/checkout`, async ({ request }) => {
        pedido = await request.json()
        return HttpResponse.json({ url: '#provedor' })
      }),
    )
    const usuario = userEvent.setup()

    renderizar(<PlanosPage />, { pathname: '/', search: '?ciclo=Mensal' })
    expect(await screen.findByText(/R\$\s?49,90/)).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Contratar Premium' }))

    await expect.poll(() => globalThis.location.hash).toBe('#provedor')
    expect(pedido).toEqual({ plano_codigo: 'premium', meio: 'Cartao' })
  })

  /** Sprint 37: o meio escolhido vai no checkout — no PIX, a página do provedor é a do PIX do primeiro ciclo. */
  it('contrata pelo PIX quando o Presidente escolhe o PIX', async () => {
    entrarComo(PAPEIS.presidente)
    comFormatura('Ativa')
    let pedido: unknown
    servidor.use(
      http.post(`${env.VITE_API_URL}/api/v1/formaturas/atual/assinatura/checkout`, async ({ request }) => {
        pedido = await request.json()
        return HttpResponse.json({ url: '#pix' })
      }),
    )
    const usuario = userEvent.setup()

    renderizar(<PlanosPage />, { pathname: '/', search: '?ciclo=Mensal' })
    await usuario.click(await screen.findByRole('button', { name: /PIX/ }))
    expect(screen.getByText(/Um PIX por ciclo/)).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Contratar Essencial' }))

    await expect.poll(() => globalThis.location.hash).toBe('#pix')
    expect(pedido).toEqual({ plano_codigo: 'essencial', meio: 'Pix' })
  })

  it('quem não é Presidente vê os planos com o motivo junto ao botão', async () => {
    entrarComo(PAPEIS.tesoureiro)
    comFormatura('Rascunho')

    renderizar(<PlanosPage />)

    expect(await screen.findByRole('button', { name: /Contratar Premium/ })).toBeDisabled()
    expect(screen.getAllByText('Só o Presidente da comissão contrata o plano.')).not.toHaveLength(0)
  })

  /** P4: com a assinatura ativa, o outro plano do ciclo é troca, não contratação nova. */
  it('turma ativa troca de plano, e o plano assinado vem marcado', async () => {
    entrarComo(PAPEIS.presidente)
    comFormatura('Ativa', { status: 'Ativa', plano: PREMIUM })
    let pedido: unknown
    servidor.use(
      http.post(
        `${env.VITE_API_URL}/api/v1/formaturas/atual/assinatura/trocar-plano`,
        async ({ request }) => {
          pedido = await request.json()
          return HttpResponse.json({ url: null })
        },
      ),
    )
    const usuario = userEvent.setup()

    renderizar(<PlanosPage />, { pathname: '/', search: '?ciclo=Mensal' })

    expect(await screen.findByRole('button', { name: 'Plano atual' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: /Contratar/ })).not.toBeInTheDocument()
    const contratado = screen.getByRole('listitem', { name: 'Premium' })
    expect(within(contratado).getByText('Plano atual', { selector: 'p' })).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Mudar para Essencial' }))

    await expect.poll(() => pedido).toEqual({ plano_codigo: 'essencial' })
  })

  it('turma ativa não troca entre mensal e anual', async () => {
    entrarComo(PAPEIS.presidente)
    comFormatura('Ativa', { status: 'Ativa', plano: PREMIUM })

    renderizar(<PlanosPage />)

    expect(await screen.findByRole('button', { name: /Mudar para Premium/ })).toBeDisabled()
    expect(screen.getAllByText(/cancele a renovação e contrate o outro ciclo/)).not.toHaveLength(0)
  })

  /** O ciclo é filtro: vive na URL, para o link mandado ao grupo abrir na mesma aba. */
  it('abre no ciclo que a URL pedir', async () => {
    entrarComo(PAPEIS.presidente)
    comFormatura('Rascunho')

    renderizar(<PlanosPage />, { pathname: '/', search: '?ciclo=Mensal' })

    expect(await screen.findByText(/R\$\s?49,90/)).toBeInTheDocument()
  })

  /** Abre no anual, como a landing: é o ciclo que a turma contrata. */
  it('abre no anual e o filtro Mensal troca os preços', async () => {
    entrarComo(PAPEIS.presidente)
    comFormatura('Rascunho')
    const usuario = userEvent.setup()

    renderizar(<PlanosPage />)
    // O anual é anunciado pelo equivalente mensal, com a cobrança cheia embaixo.
    expect(await screen.findByText(/R\$\s?39,92/)).toBeInTheDocument()
    expect(screen.getByText(/Cobrança única de R\$\s?479,00/)).toBeInTheDocument()
    // A porcentagem sai do preço cheio do catálogo, nunca de texto fixo.
    expect(screen.getByText('Economize 20%')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Mensal' }))

    expect(await screen.findByText(/R\$\s?49,90/)).toBeInTheDocument()
    expect(screen.queryByText(/R\$\s?39,92/)).not.toBeInTheDocument()
  })
})
