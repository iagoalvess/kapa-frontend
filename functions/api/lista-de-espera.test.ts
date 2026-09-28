import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { servidor } from '../../src/test/msw/server.ts'
import { type Ambiente, type BancoD1, onRequestPost } from './lista-de-espera.ts'

const VALIDA = {
  nome: 'Ana Souza',
  email: '  Ana@Exemplo.com ',
  instituicao: 'UFPR',
  curso: 'Odontologia',
  semestre_de_formatura: '2027.2',
  papel: 'presidente',
  tamanho_da_turma: 'de_51_a_100',
  whatsapp: '(41) 99999-0000',
  aceite: true,
  origem: 'utm_source=instagram',
  token_do_turnstile: 'token-bom',
}

/** Um D1 que só anota o que recebeu. */
function bancoFalso() {
  const gravacoes: unknown[][] = []
  const banco: BancoD1 = {
    prepare: () => ({ bind: (...valores) => ({ run: async () => gravacoes.push(valores) }) }),
  }
  return { banco, gravacoes }
}

function enviar(corpo: unknown, env: Ambiente) {
  const request = new Request('https://site.teste/api/lista-de-espera', {
    method: 'POST',
    body: JSON.stringify(corpo),
  })
  return onRequestPost({ request, env })
}

describe('POST /api/lista-de-espera', () => {
  let tokensConferidos: string[]

  beforeEach(() => {
    tokensConferidos = []
    servidor.use(
      http.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', async ({ request }) => {
        const dados = new URLSearchParams(await request.text())
        tokensConferidos.push(dados.get('response') ?? '')
        return HttpResponse.json({
          success: dados.get('secret') === 'segredo' && dados.get('response') === 'token-bom',
        })
      }),
    )
  })

  it('grava a inscrição com o e-mail normalizado, a versão do aviso e sem IP', async () => {
    const { banco, gravacoes } = bancoFalso()

    const resposta = await enviar(VALIDA, { LISTA_DE_ESPERA: banco, TURNSTILE_SECRET: 'segredo' })

    expect(resposta.status).toBe(204)
    expect(gravacoes).toHaveLength(1)
    const [email, , , , semestre, papel, faixa, whatsapp, aceitoEm, versao, origem] = gravacoes[0]!
    expect([email, semestre, papel, faixa, whatsapp, versao, origem]).toEqual([
      'ana@exemplo.com',
      '2027.2',
      'presidente',
      'de_51_a_100',
      '41999990000',
      1,
      'utm_source=instagram',
    ])
    expect(aceitoEm).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/)
  })

  it('recusa sem Turnstile válido, mesmo chamando a Function direto, e não grava', async () => {
    const { banco, gravacoes } = bancoFalso()

    const semToken = await enviar(
      { ...VALIDA, token_do_turnstile: undefined },
      { LISTA_DE_ESPERA: banco, TURNSTILE_SECRET: 'segredo' },
    )
    const tokenRuim = await enviar(
      { ...VALIDA, token_do_turnstile: 'forjado' },
      { LISTA_DE_ESPERA: banco, TURNSTILE_SECRET: 'segredo' },
    )

    expect(semToken.status).toBe(400)
    expect(await tokenRuim.json()).toMatchObject({ codigo: 'lista_de_espera.verificacao' })
    expect(tokensConferidos).toEqual(['forjado'])
    expect(gravacoes).toHaveLength(0)
  })

  it('devolve os erros por campo com a lista fechada de papel e faixa', async () => {
    const { banco, gravacoes } = bancoFalso()

    const resposta = await enviar(
      { ...VALIDA, papel: 'toString', tamanho_da_turma: 'mil', aceite: false, whatsapp: '123' },
      { LISTA_DE_ESPERA: banco, TURNSTILE_SECRET: 'segredo' },
    )

    expect(resposta.status).toBe(400)
    const corpo = (await resposta.json()) as { errors: Record<string, string[]> }
    expect(Object.keys(corpo.errors).toSorted()).toEqual(['aceite', 'papel', 'tamanho_da_turma', 'whatsapp'])
    expect(gravacoes).toHaveLength(0)
  })

  it('responde 404 onde não há banco nem segredo — o projeto do app', async () => {
    expect((await enviar(VALIDA, {})).status).toBe(404)
    expect(tokensConferidos).toEqual([])
  })
})
