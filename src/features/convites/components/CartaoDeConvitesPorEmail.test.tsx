import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS, PERFIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import { CartaoDeConvitesPorEmail } from './CartaoDeConvitesPorEmail'

const ATUAL = `${env.VITE_API_URL}/api/v1/formaturas/atual`
const CONVITES = `${ATUAL}/convites`

function entrarComo(papel: string) {
  const corpo = { sub: 'u-1', name: 'Ana', role: [PERFIS.usuario], formatura_id: 'f-1', papel }
  sessao.autenticar({
    access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  })
}

const aceito = {
  id: 'c-2',
  email: 'bruno@exemplo.com',
  papel: 'Formando',
  expira_em: '2026-09-18T12:00:00Z',
  usos_maximos: 1,
  usos_feitos: 1,
  status: 'Aceito',
  criado_em: '2026-09-11T12:00:00Z',
}

const pendente = { ...aceito, id: 'c-3', email: 'carla@exemplo.com', usos_feitos: 0, status: 'Pendente' }

// O link da turma vem na mesma lista, sem `email`: este cartão não o mostra.
const link = { ...aceito, id: 'c-1', email: undefined, usos_maximos: 80, status: 'Pendente' }

function responder(convites: unknown[] = [], status = 'Ativa', extras: object = { ja_contratou: true }) {
  servidor.use(
    http.get(ATUAL, () =>
      HttpResponse.json({ id: 'f-1', status, quantidade_estimada_de_formandos: 80, ...extras }),
    ),
    http.get(CONVITES, () => HttpResponse.json(convites)),
  )
}

describe('CartaoDeConvitesPorEmail', () => {
  afterEach(() => sessao.encerrar())

  it('Comissão convida só formando; o Presidente escolhe o papel', async () => {
    responder()
    entrarComo(PAPEIS.comissao)

    const { unmount } = renderizar(<CartaoDeConvitesPorEmail />)
    await screen.findByText('Nenhum convite enviado ainda.')
    expect(screen.queryByLabelText('Papel do convidado')).not.toBeInTheDocument()
    unmount()

    entrarComo(PAPEIS.presidente)
    renderizar(<CartaoDeConvitesPorEmail />)
    expect(await screen.findByLabelText('Papel do convidado')).toBeInTheDocument()
  })

  /** No gratuito a comissão se monta por e-mail; formando espera a contratação. */
  it('no plano gratuito, o Presidente convida só a comissão', async () => {
    responder([], 'Ativa', { ja_contratou: false })
    entrarComo(PAPEIS.presidente)

    renderizar(<CartaoDeConvitesPorEmail />)

    await screen.findByText(/Para convidar formandos, contrate um plano/)
    await waitFor(() => {
      const papeis = within(screen.getByLabelText('Papel do convidado')).getAllByRole('option')
      expect(papeis.map((opcao) => opcao.textContent)).toEqual(['Tesoureiro', 'Comissão', 'Presidente'])
    })
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
          expira_em: aceito.expira_em,
        })
      }),
    )
    entrarComo(PAPEIS.presidente)

    renderizar(<CartaoDeConvitesPorEmail />)
    await userEvent.type(await screen.findByLabelText('E-mail do convidado'), 'carla@exemplo.com')
    await userEvent.selectOptions(screen.getByLabelText('Papel do convidado'), 'Tesoureiro')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar convite' }))

    await waitFor(() => expect(enviado).toEqual({ email: 'carla@exemplo.com', papel: 'Tesoureiro' }))
  })

  it('lista só os convites por e-mail, com a situação, e revoga o pendente', async () => {
    let revogado = false
    responder([link, aceito, pendente])
    servidor.use(
      http.delete(`${CONVITES}/c-3`, () => {
        revogado = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    entrarComo(PAPEIS.presidente)

    renderizar(<CartaoDeConvitesPorEmail />)

    expect(await screen.findByText('bruno@exemplo.com')).toBeInTheDocument()
    expect(screen.getByText('Aceito')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(
      screen.queryByRole('button', { name: 'Revogar convite de bruno@exemplo.com' }),
    ).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Revogar convite de carla@exemplo.com' }))

    // Revogar mata o link que a pessoa já recebeu: confirma antes.
    const confirmacao = await screen.findByRole('alertdialog')
    expect(confirmacao).toHaveTextContent('carla@exemplo.com')
    await userEvent.click(within(confirmacao).getByRole('button', { name: 'Revogar' }))

    await waitFor(() => expect(revogado).toBe(true))
  })
})
