import { describe, expect, it } from 'vitest'
import { EXEMPLO, esquemaDoDegrau, renderizar, variaveisDesconhecidas } from './notificacoes.schema'
import type { Regua } from '../types/notificacoes.types'

const REGUA: Regua = {
  regras: [],
  variaveis: ['nome', 'valor', 'vencimento', 'link', 'formatura', 'quantidade'],
  tamanho_maximo: 2000,
  tamanho_maximo_do_assunto: 150,
}

const degrau = (template: string, assunto = 'Oi, {nome}') => ({
  assunto,
  template,
  ativa: true,
  avisar_tesouraria: false,
})

describe('variáveis do template', () => {
  it('aponta a que não existe', () => {
    expect(variaveisDesconhecidas('Vence em {vencimeto}', REGUA.variaveis)).toEqual(['vencimeto'])
  })

  it('não reclama do template correto', () => {
    expect(variaveisDesconhecidas('{nome} deve {valor}', REGUA.variaveis)).toEqual([])
  })

  it('troca pelo exemplo na prévia', () => {
    expect(renderizar('Oi, {nome}! São {valor}.', EXEMPLO)).toBe('Oi, Ana Souza! São R$ 350,00.')
  })

  it('deixa vazio o que não tem exemplo', () => {
    expect(renderizar('[{inexistente}]', EXEMPLO)).toBe('[]')
  })
})

describe('esquemaDoDegrau', () => {
  it('recusa a variável desconhecida antes de a API ver', () => {
    const resultado = esquemaDoDegrau(REGUA).safeParse(degrau('Vence em {vencimeto}.'))

    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues[0]?.message).toContain('{vencimeto}')
  })

  it('aceita o template com as variáveis certas', () => {
    expect(esquemaDoDegrau(REGUA).safeParse(degrau('Oi, {nome}, são {valor}.')).success).toBe(true)
  })

  it('recusa a mensagem vazia', () => {
    expect(esquemaDoDegrau(REGUA).safeParse(degrau('   ')).success).toBe(false)
  })

  it('recusa o que passa do teto de caracteres', () => {
    expect(esquemaDoDegrau(REGUA).safeParse(degrau('a'.repeat(2001))).success).toBe(false)
  })
})
