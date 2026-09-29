import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import { ListaDeEspera } from './ListaDeEspera'

const ENDERECO = `${globalThis.location.origin}/api/lista-de-espera`
const SEMESTRE = `${new Date().getFullYear() + 1}.2`

/** O Turnstile de mentira: cada widget montado entrega um token novo na hora. */
let widgets = 0

beforeEach(() => {
  widgets = 0
  globalThis.turnstile = {
    render: (_, opcoes) => {
      widgets += 1
      opcoes.callback(`token-${widgets}`)
      return `widget-${widgets}`
    },
    remove: () => {},
  }
})

afterEach(() => {
  globalThis.turnstile = undefined
})

async function preencher() {
  const usuario = userEvent.setup()
  await usuario.type(screen.getByLabelText('Seu nome'), 'Ana Souza')
  await usuario.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com')
  await usuario.type(screen.getByLabelText('Instituição'), 'UFPR')
  await usuario.type(screen.getByLabelText('Curso'), 'Odontologia')
  await usuario.selectOptions(screen.getByLabelText('A turma se forma em'), SEMESTRE)
  await usuario.selectOptions(screen.getByLabelText('Você é da turma como'), 'formando')
  await usuario.selectOptions(screen.getByLabelText('Tamanho da turma'), 'ate_50')
  await usuario.click(screen.getByRole('checkbox'))
  return usuario
}

describe('lista de espera', () => {
  it('envia à Function do site, com o token e a origem, e confirma sem dizer se já estava na lista', async () => {
    const corpos: Record<string, unknown>[] = []
    servidor.use(
      http.post(ENDERECO, async ({ request }) => {
        corpos.push((await request.json()) as Record<string, unknown>)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderizar(<ListaDeEspera />, '/?utm_source=instagram&ref=x')
    globalThis.history.replaceState(null, '', '/?utm_source=instagram&ref=x')

    const usuario = await preencher()
    await usuario.click(screen.getByRole('button', { name: 'Criar minha turma' }))

    expect(await screen.findByText('Recebemos sua inscrição.')).toBeInTheDocument()
    expect(corpos[0]).toMatchObject({
      email: 'ana@exemplo.com',
      semestre_de_formatura: SEMESTRE,
      papel: 'formando',
      token_do_turnstile: 'token-1',
      origem: 'utm_source=instagram',
    })
  })

  it('o aviso de privacidade fica a um clique, numa aba nova', () => {
    renderizar(<ListaDeEspera />)

    expect(screen.getByRole('link', { name: 'aviso de privacidade' })).toHaveAttribute(
      'href',
      '/lista-de-espera/privacidade',
    )
  })

  it('recusado pelo Turnstile, mostra o erro e pega um token novo para a próxima tentativa', async () => {
    const tokens: unknown[] = []
    servidor.use(
      http.post(ENDERECO, async ({ request }) => {
        tokens.push(((await request.json()) as Record<string, unknown>).token_do_turnstile)
        return tokens.length === 1
          ? HttpResponse.json(
              {
                status: 400,
                codigo: 'lista_de_espera.verificacao',
                title: 'Não conseguimos confirmar que você não é um robô. Tente de novo.',
              },
              { status: 400 },
            )
          : new HttpResponse(null, { status: 204 })
      }),
    )
    renderizar(<ListaDeEspera />)

    const usuario = await preencher()
    await usuario.click(screen.getByRole('button', { name: 'Criar minha turma' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('não é um robô')

    await usuario.click(screen.getByRole('button', { name: 'Criar minha turma' }))

    expect(await screen.findByText('Recebemos sua inscrição.')).toBeInTheDocument()
    expect(tokens).toEqual(['token-1', 'token-2'])
  })

  it('não envia sem os campos obrigatórios nem o aceite', async () => {
    renderizar(<ListaDeEspera />)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Criar minha turma' }))

    expect(await screen.findByText('Confirme que leu o aviso de privacidade.')).toBeInTheDocument()
    expect(screen.getByText('Escolha o seu papel na turma.')).toBeInTheDocument()
  })
})
