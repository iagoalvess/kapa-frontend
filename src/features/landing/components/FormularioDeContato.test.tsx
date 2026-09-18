import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import { FormularioDeContato } from './FormularioDeContato'

const LEADS = `${env.VITE_API_URL}/api/v1/leads`

/** Corpo do último envio que chegou à API, para conferir o que a tela mandou. */
function capturarEnvio() {
  const enviados: Record<string, unknown>[] = []

  servidor.use(
    http.post(LEADS, async ({ request }) => {
      enviados.push((await request.json()) as Record<string, unknown>)
      return new HttpResponse(null, { status: 204 })
    }),
  )

  return enviados
}

/** Preenche os campos obrigatórios do formulário. */
async function preencher(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText('Seu nome'), 'Ana Souza')
  await usuario.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com')
  await usuario.type(screen.getByLabelText('Instituição'), 'UFPR')
  await usuario.type(screen.getByLabelText('Curso'), 'Medicina')
}

describe('FormularioDeContato', () => {
  it('troca o formulário pelo agradecimento depois de enviar', async () => {
    // Arrange
    capturarEnvio()
    const usuario = userEvent.setup()
    renderizar(<FormularioDeContato />)

    // Act
    await preencher(usuario)
    await usuario.click(screen.getByRole('button', { name: /Enviar contato/ }))

    // Assert
    expect(await screen.findByText('Recebemos seu contato')).toBeInTheDocument()
    expect(screen.queryByLabelText('Seu nome')).not.toBeInTheDocument()
  })

  /**
   * A origem da visita vem da query string e viaja no corpo: a API não enxerga a URL que o
   * navegador abriu, e sem isto o comercial não sabe de onde o contato veio.
   */
  it('manda os utm da query string junto com o contato', async () => {
    const enviados = capturarEnvio()
    const usuario = userEvent.setup()
    renderizar(<FormularioDeContato />, '/?utm_source=instagram&utm_medium=social&utm_campaign=lancamento')

    await preencher(usuario)
    await usuario.click(screen.getByRole('button', { name: /Enviar contato/ }))

    await waitFor(() => expect(enviados).toHaveLength(1))
    expect(enviados[0]).toMatchObject({
      origem: 'instagram',
      meio: 'social',
      campanha: 'lancamento',
    })
  })

  /** O honeypot é um campo escondido que só robô preenche. A tela o manda vazio. */
  it('manda o honeypot vazio e não o mostra a ninguém', async () => {
    const enviados = capturarEnvio()
    const usuario = userEvent.setup()
    renderizar(<FormularioDeContato />)

    // O campo existe no HTML, que é o ponto: o robô o encontra e a pessoa não.
    const honeypot = screen.getByLabelText('Não preencha este campo', { selector: 'input' })
    expect(honeypot).toHaveAttribute('tabIndex', '-1')

    await preencher(usuario)
    await usuario.click(screen.getByRole('button', { name: /Enviar contato/ }))

    await waitFor(() => expect(enviados).toHaveLength(1))
    expect(enviados[0]).toMatchObject({ sobrenome: '' })
  })

  /** Sem o consentimento não há envio: quem preenche o formulário também é titular de dados. */
  it('recusa o envio com a caixa da Política desmarcada', async () => {
    const enviados = capturarEnvio()
    const usuario = userEvent.setup()
    renderizar(<FormularioDeContato />)

    await preencher(usuario)
    await usuario.click(screen.getByRole('checkbox'))
    await usuario.click(screen.getByRole('button', { name: /Enviar contato/ }))

    expect(await screen.findByText(/Marque que você leu a Política/)).toBeInTheDocument()
    expect(enviados).toHaveLength(0)
  })

  /** Falha da API não pode engolir o que a pessoa digitou. */
  it('mantém o formulário e mostra o erro quando a API recusa', async () => {
    servidor.use(
      http.post(LEADS, () =>
        HttpResponse.json(
          { status: 429, codigo: 'rate_limit.excedido', title: 'Muitas requisições.' },
          { status: 429 },
        ),
      ),
    )
    const usuario = userEvent.setup()
    renderizar(<FormularioDeContato />)

    await preencher(usuario)
    await usuario.click(screen.getByRole('button', { name: /Enviar contato/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Muitas requisições/)
    expect(screen.getByLabelText('Seu nome')).toHaveValue('Ana Souza')
  })
})
