import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS, PERFIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import { CartaoDoLinkDaTurma } from './CartaoDoLinkDaTurma'

const ATUAL = `${env.VITE_API_URL}/api/v1/formaturas/atual`
const CONVITES = `${ATUAL}/convites`

function entrarComo(papel: string) {
  const corpo = { sub: 'u-1', name: 'Ana', role: [PERFIS.usuario], formatura_id: 'f-1', papel }
  sessao.autenticar({
    access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  })
}

// Sem `email`: a API omite campo nulo, e é assim que o link da turma chega.
const vigente = {
  id: 'c-1',
  papel: 'Formando',
  expira_em: '2026-12-10T12:00:00Z',
  usos_maximos: 80,
  usos_feitos: 3,
  status: 'Pendente',
  criado_em: '2026-09-11T12:00:00Z',
  link: 'https://app.kapa/convite/tk-1',
}

function responder(convites: unknown[], status = 'Ativa') {
  servidor.use(
    http.get(ATUAL, () => HttpResponse.json({ id: 'f-1', status, quantidade_estimada_de_formandos: 80 })),
    http.get(CONVITES, () => HttpResponse.json(convites)),
  )
}

describe('CartaoDoLinkDaTurma', () => {
  afterEach(() => sessao.encerrar())

  /**
   * Validade e limite são do backend: o pedido vai vazio, e o link já sai copiado. O link antigo,
   * de antes do token gravado, vale mas não tem endereço: conta como sem link.
   */
  it('sem link para copiar, oferece só gerar; gera com o pedido vazio e copia', async () => {
    const usuario = userEvent.setup()
    let enviado: unknown
    let convites: unknown[] = [{ ...vigente, link: undefined }]
    responder(convites)
    servidor.use(
      http.get(CONVITES, () => HttpResponse.json(convites)),
      http.post(CONVITES, async ({ request }) => {
        enviado = await request.json()
        convites = [{ ...vigente, id: 'c-9', usos_feitos: 0, link: 'https://app.kapa/convite/tk-9' }]
        return HttpResponse.json({
          id: 'c-9',
          link: 'https://app.kapa/convite/tk-9',
          expira_em: vigente.expira_em,
        })
      }),
    )
    entrarComo(PAPEIS.comissao)

    renderizar(<CartaoDoLinkDaTurma />)

    const gerar = await screen.findByRole('button', { name: 'Gerar link' })
    expect(screen.queryByRole('button', { name: 'Gerar novo link' })).not.toBeInTheDocument()
    await usuario.click(gerar)

    expect(await screen.findByRole('button', { name: 'Copiar link' })).toBeInTheDocument()
    expect(enviado).toEqual({})
    expect(await navigator.clipboard.readText()).toBe('https://app.kapa/convite/tk-9')
    expect(screen.queryByText('https://app.kapa/convite/tk-9')).not.toBeInTheDocument()
  })

  it('com link vigente, copia sem mostrar o endereço e informa validade e entradas', async () => {
    const usuario = userEvent.setup()
    responder([vigente])
    entrarComo(PAPEIS.comissao)

    renderizar(<CartaoDoLinkDaTurma />)

    await usuario.click(await screen.findByRole('button', { name: 'Copiar link' }))

    expect(await navigator.clipboard.readText()).toBe('https://app.kapa/convite/tk-1')
    expect(screen.getByText('Vale até 10/12/2026 · 3 de 80 entradas')).toBeInTheDocument()
  })

  /** Sem histórico, trocar o link é o único jeito de desligar um link vazado — e pede confirmação. */
  it('gerar um novo link pede confirmação antes de desativar o atual', async () => {
    let gerou = false
    responder([vigente])
    servidor.use(
      http.post(CONVITES, () => {
        gerou = true
        return HttpResponse.json({
          id: 'c-9',
          link: 'https://app.kapa/convite/tk-9',
          expira_em: vigente.expira_em,
        })
      }),
    )
    entrarComo(PAPEIS.comissao)

    renderizar(<CartaoDoLinkDaTurma />)

    await userEvent.click(await screen.findByRole('button', { name: 'Gerar novo link' }))
    expect(gerou).toBe(false)
    await userEvent.click(screen.getByRole('button', { name: 'Gerar novo' }))

    await waitFor(() => expect(gerou).toBe(true))
  })

  /** Formando só entra com a turma ativa: antes disso o cartão nem aparece. */
  it('não aparece com a turma a contratar', async () => {
    responder([], 'Rascunho')
    entrarComo(PAPEIS.presidente)

    const { container } = renderizar(<CartaoDoLinkDaTurma />)

    await waitFor(() => expect(container).toBeEmptyDOMElement())
    expect(screen.queryByRole('region', { name: 'Link da turma' })).not.toBeInTheDocument()
  })
})
