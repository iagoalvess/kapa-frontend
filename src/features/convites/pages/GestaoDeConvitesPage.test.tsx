import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS, PERFIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import GestaoDeConvitesPage from './GestaoDeConvitesPage'

const ATUAL = `${env.VITE_API_URL}/api/v1/formaturas/atual`
const CONVITES = `${ATUAL}/convites`

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
    accessToken: `c.${btoa(JSON.stringify(corpo))}.a`,
    expiraEm: new Date(Date.now() + 900_000).toISOString(),
  })
}

// Sem `email`: a API omite campo nulo, e é assim que o link da turma chega.
const link = {
  id: 'c-1',
  papel: 'Formando',
  expiraEm: '2026-12-10T12:00:00Z',
  usosMaximos: 88,
  usosFeitos: 3,
  status: 'Pendente',
  criadoEm: '2026-09-11T12:00:00Z',
}

const nominal = {
  id: 'c-2',
  email: 'bruno@exemplo.com',
  papel: 'Formando',
  expiraEm: '2026-09-18T12:00:00Z',
  usosMaximos: 1,
  usosFeitos: 1,
  status: 'Aceito',
  criadoEm: '2026-09-11T12:00:00Z',
}

function responder(convites: unknown[] = [], status = 'Ativa') {
  servidor.use(
    http.get(ATUAL, () => HttpResponse.json({ id: 'f-1', status, quantidadeEstimadaDeFormandos: 80 })),
    http.get(CONVITES, () => HttpResponse.json(convites)),
  )
}

describe('GestaoDeConvitesPage', () => {
  afterEach(() => sessao.encerrar())

  /** O limite sugerido é formandos estimados + 10%; o link aparece uma vez, com o aviso. */
  it('gera o link da turma com o limite sugerido e mostra o link uma única vez', async () => {
    let enviado: unknown
    responder()
    servidor.use(
      http.post(CONVITES, async ({ request }) => {
        enviado = await request.json()
        return HttpResponse.json({
          id: 'c-9',
          link: 'https://app.kapa/convite/tk-9',
          expiraEm: '2026-12-10T12:00:00Z',
        })
      }),
    )
    entrarComo(PAPEIS.comissao)

    renderizar(<GestaoDeConvitesPage />)

    await waitFor(() => expect(screen.getByLabelText('Limite de entradas')).toHaveValue(88))
    await userEvent.click(screen.getByRole('button', { name: 'Gerar link' }))

    expect(await screen.findByLabelText('Link do convite')).toHaveValue('https://app.kapa/convite/tk-9')
    expect(screen.getByText(/Copie agora/)).toBeInTheDocument()
    expect(screen.getByLabelText('QR code do link')).toBeInTheDocument()
    expect(enviado).toEqual({ diasDeValidade: 90, usosMaximos: 88 })
  })

  it('Comissão convida só formando; o Presidente escolhe o papel', async () => {
    responder()
    entrarComo(PAPEIS.comissao)

    const { unmount } = renderizar(<GestaoDeConvitesPage />)
    await screen.findByText('Nenhum convite enviado ainda.')
    expect(screen.queryByLabelText('Papel do convidado')).not.toBeInTheDocument()
    unmount()

    entrarComo(PAPEIS.presidente)
    renderizar(<GestaoDeConvitesPage />)
    expect(await screen.findByLabelText('Papel do convidado')).toBeInTheDocument()
  })

  /** Antes de pagar, a comissão se monta por e-mail; o link de formandos espera a contratação. */
  it('em rascunho, o Presidente convida só a comissão e o link fica bloqueado', async () => {
    responder([], 'Rascunho')
    entrarComo(PAPEIS.presidente)

    renderizar(<GestaoDeConvitesPage />)

    expect(await screen.findByText(/Liberado depois da contratação/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gerar link' })).toBeDisabled()
    const papeis = within(screen.getByLabelText('Papel do convidado')).getAllByRole('option')
    expect(papeis.map((opcao) => opcao.textContent)).toEqual(['Tesoureiro', 'Comissão', 'Presidente'])
    expect(screen.getByRole('button', { name: 'Enviar convite' })).toBeEnabled()
  })

  it('envia o convite por e-mail com o papel escolhido', async () => {
    let enviado: unknown
    responder()
    servidor.use(
      http.post(CONVITES, async ({ request }) => {
        enviado = await request.json()
        return HttpResponse.json({
          id: 'c-9',
          link: 'https://app.kapa/convite/tk-9',
          expiraEm: '2026-09-19T12:00:00Z',
        })
      }),
    )
    entrarComo(PAPEIS.presidente)

    renderizar(<GestaoDeConvitesPage />)
    await userEvent.type(await screen.findByLabelText('E-mail do convidado'), 'carla@exemplo.com')
    await userEvent.selectOptions(screen.getByLabelText('Papel do convidado'), 'Tesoureiro')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar convite' }))

    await waitFor(() => expect(enviado).toEqual({ email: 'carla@exemplo.com', papel: 'Tesoureiro' }))
  })

  it('lista o link com as entradas e o nominal com a situação, e revoga o pendente', async () => {
    let revogado = false
    responder([link, nominal])
    servidor.use(
      http.delete(`${CONVITES}/c-1`, () => {
        revogado = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    entrarComo(PAPEIS.presidente)

    renderizar(<GestaoDeConvitesPage />)

    const secaoDoLink = await screen.findByRole('region', { name: 'Link da turma' })
    expect(await within(secaoDoLink).findByText('3 de 88')).toBeInTheDocument()
    expect(within(secaoDoLink).getByText('Ativo')).toBeInTheDocument()

    const secaoNominal = screen.getByRole('region', { name: 'Convites por e-mail' })
    expect(within(secaoNominal).getByText('bruno@exemplo.com')).toBeInTheDocument()
    expect(within(secaoNominal).getByText('Aceito')).toBeInTheDocument()
    expect(within(secaoNominal).queryByRole('button', { name: /Revogar/ })).not.toBeInTheDocument()

    await userEvent.click(within(secaoDoLink).getByRole('button', { name: /Revogar/ }))
    await waitFor(() => expect(revogado).toBe(true))
  })
})
