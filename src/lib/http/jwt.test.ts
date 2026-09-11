import { describe, expect, it } from 'vitest'
import { lerAccessToken } from './jwt'

/**
 * Monta um JWT com o corpo informado. Assinatura é texto qualquer — `lerAccessToken` não a
 * confere, e é justamente isso que o teste documenta.
 */
function token(corpo: unknown): string {
  // Passa por TextEncoder porque `btoa` sozinho lê a string como latin-1 e corrompe a
  // acentuação. O backend emite os bytes em UTF-8, e é esse formato que o teste precisa imitar.
  const bytes = new TextEncoder().encode(JSON.stringify(corpo))
  const binario = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('')
  const base64 = btoa(binario).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')

  return `cabecalho.${base64}.assinatura`
}

describe('lerAccessToken', () => {
  it('lê as claims do corpo', () => {
    const usuario = lerAccessToken(
      token({
        sub: 'abc-123',
        name: 'Maria Souza',
        email: 'maria@exemplo.com',
        role: ['Administrador'],
        formatura_id: 'f-1',
        papel: 'Tesoureiro',
      }),
    )

    expect(usuario).toEqual({
      id: 'abc-123',
      nome: 'Maria Souza',
      email: 'maria@exemplo.com',
      perfis: ['Administrador'],
      formaturaId: 'f-1',
      papel: 'Tesoureiro',
    })
  })

  /**
   * Token sem formatura continua válido: é o que o login emite, e o que serve para listar as
   * turmas e escolher uma. Ler `formaturaId` como string vazia faria a guarda achar que há
   * formatura selecionada.
   */
  it('trata ausência de formatura como nulo', () => {
    const usuario = lerAccessToken(token({ sub: '1' }))

    expect(usuario?.formaturaId).toBeNull()
    expect(usuario?.papel).toBeNull()
  })

  /**
   * O backend emite uma claim `role` por perfil. Com um perfil só, a desserialização entrega
   * uma string em vez de um array — e um `perfis` que é string quebra todo `includes` a jusante.
   */
  it('normaliza uma claim role escalar para array', () => {
    expect(lerAccessToken(token({ sub: '1', role: 'Usuario' }))?.perfis).toEqual(['Usuario'])
  })

  it('trata ausência de role como lista vazia', () => {
    expect(lerAccessToken(token({ sub: '1' }))?.perfis).toEqual([])
  })

  it('preenche com string vazia as claims ausentes', () => {
    expect(lerAccessToken(token({}))).toEqual({
      id: '',
      nome: '',
      email: '',
      perfis: [],
      formaturaId: null,
      papel: null,
    })
  })

  /** Acentuação sobrevive: o corpo é UTF-8, não latin-1. */
  it('decodifica caracteres fora do ASCII', () => {
    expect(lerAccessToken(token({ sub: '1', name: 'João Conceição' }))?.nome).toBe('João Conceição')
  })

  it.each([
    ['sem as três partes', 'apenas-um-pedaco'],
    ['com corpo que não é base64', 'cabecalho.!!!.assinatura'],
    ['com corpo que não é JSON', `cabecalho.${btoa('isto nao e json')}.assinatura`],
    ['vazio', ''],
  ])('devolve null para token %s', (_descricao, valor) => {
    expect(lerAccessToken(valor)).toBeNull()
  })
})
