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
  preco_em_centavos: 14990,
  ciclo: 'Mensal',
  limite_de_formandos: 60,
  modulos: MODULOS,
  recomendado: false,
}

const COMPLETO = {
  id: 'p-2',
  codigo: 'completo',
  nome: 'Completo',
  descricao: 'O dia a dia da comissão inteiro.',
  preco_em_centavos: 34990,
  ciclo: 'Mensal',
  limite_de_formandos: 150,
  modulos: [...MODULOS, 'Caixa e relatórios'],
  recomendado: true,
}

const COMPLETO_ANUAL = {
  ...COMPLETO,
  id: 'p-3',
  codigo: 'completo-anual',
  preco_em_centavos: 356900,
  preco_cheio_em_centavos: 419880,
  ciclo: 'Anual',
}

const PLANOS = [ESSENCIAL, COMPLETO, COMPLETO_ANUAL]

function entrarComo(papel: string) {
  const corpo = { sub: 'u-1', name: 'Ana', formatura_id: 'f-1', papel }
  sessao.autenticar({
    access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  })
}

/** @param assinatura A assinatura da turma; ausente, a API responde 404, como antes de contratar. */
function comFormatura(status: string, assinatura?: { status: string; plano: typeof COMPLETO }) {
  servidor.use(
    http.get(`${env.VITE_API_URL}/api/v1/planos`, () => HttpResponse.json(PLANOS)),
    http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () => HttpResponse.json({ id: 'f-1', status })),
    http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual/assinatura`, () =>
      assinatura
        ? HttpResponse.json({ id: 'a-1', criado_em: '2026-09-01T00:00:00Z', ...assinatura })
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

    renderizar(<PlanosPage />)
    expect(await screen.findByText(/R\$\s?349,90/)).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Contratar Completo' }))

    await expect.poll(() => globalThis.location.hash).toBe('#provedor')
    expect(pedido).toEqual({ planoCodigo: 'completo' })
  })

  it('quem não é Presidente vê os planos com o motivo no próprio botão', async () => {
    entrarComo(PAPEIS.tesoureiro)
    comFormatura('Rascunho')

    renderizar(<PlanosPage />)

    expect(await screen.findByRole('button', { name: /Contratar Completo/ })).toBeDisabled()
    expect(screen.getAllByText('Só o Presidente da comissão contrata o plano.')).not.toHaveLength(0)
  })

  it('turma ativa não contrata de novo, e o plano assinado vem marcado', async () => {
    entrarComo(PAPEIS.presidente)
    comFormatura('Ativa', { status: 'Ativa', plano: COMPLETO })

    renderizar(<PlanosPage />)

    expect(await screen.findByRole('button', { name: 'Plano atual' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Contratar Essencial/ })).toBeDisabled()
    const contratado = screen.getByRole('article', { name: 'Completo' })
    expect(within(contratado).getByText('Plano atual', { selector: 'p' })).toBeInTheDocument()
  })

  /** O ciclo é filtro: vive na URL, para o link mandado ao grupo abrir na mesma aba. */
  it('abre no ciclo que a URL pedir', async () => {
    entrarComo(PAPEIS.presidente)
    comFormatura('Rascunho')

    renderizar(<PlanosPage />, { pathname: '/', search: '?ciclo=Anual' })

    expect(await screen.findByText(/R\$\s?3\.569,00/)).toBeInTheDocument()
  })

  it('o filtro Anual troca os preços', async () => {
    entrarComo(PAPEIS.presidente)
    comFormatura('Rascunho')
    const usuario = userEvent.setup()

    renderizar(<PlanosPage />)
    expect(await screen.findByText(/R\$\s?349,90/)).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /^Anual/ }))

    expect(await screen.findByText(/R\$\s?3\.569,00/)).toBeInTheDocument()
    expect(screen.queryByText(/R\$\s?349,90/)).not.toBeInTheDocument()
    // No filtro e no card: a porcentagem sai do preço cheio do catálogo, nunca de texto fixo.
    expect(screen.getAllByText('Economize 15%')).toHaveLength(2)
  })

  it('a tabela mostra o que cada plano do ciclo inclui', async () => {
    entrarComo(PAPEIS.presidente)
    comFormatura('Rascunho')

    renderizar(<PlanosPage />)

    const tabela = within(await screen.findByRole('table'))
    const linha = tabela.getByRole('row', { name: /Caixa e relatórios/ })
    expect(within(linha).getByText('Não incluído no Essencial')).toBeInTheDocument()
    expect(within(linha).getByText('Incluído no Completo')).toBeInTheDocument()
  })
})
