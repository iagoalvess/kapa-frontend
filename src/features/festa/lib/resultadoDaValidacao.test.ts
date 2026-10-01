import { describe, expect, it } from 'vitest'
import { ErroDaApi, ErroDeRede } from '@/lib/http/erros'
import { resultadoDaValidacao } from './resultadoDaValidacao'

const ANA = 'usuario-ana'
const AGORA = new Date('2027-12-12T01:14:30Z')

const anterior = (por: string, em: string) => ({
  check_in_id: 'c1',
  validado_em: em,
  validado_por: por === ANA ? 'Ana' : 'Bruno',
  validado_por_usuario_id: por,
})

const jaValidado = (dados: unknown) =>
  new ErroDaApi(409, { codigo: 'festa.ja_validado', detail: 'Já validado.', dados })

const conflito = (codigo: string) => ({ erro: new ErroDaApi(409, { codigo, detail: 'texto' }) })

describe('resultadoDaValidacao', () => {
  it('a entrada gravada é verde, com a entrada para desfazer', () => {
    const entrada = anterior(ANA, '2027-12-12T01:14:00Z')

    const resultado = resultadoDaValidacao({ entrada }, ANA, AGORA)

    expect(resultado.tom).toBe('entrou')
    expect(resultado.entrada).toBe(entrada)
  })

  it('já validado por outra pessoa é vermelho, com quem e quando', () => {
    const resultado = resultadoDaValidacao(
      { erro: jaValidado(anterior('outro', '2027-12-12T01:10:00Z')) },
      ANA,
      AGORA,
    )

    expect(resultado.tom).toBe('barrado')
    expect(resultado.titulo).toMatch(/^Já validado às \d{2}:\d{2}$/)
    expect(resultado.detalhe).toContain('Bruno')
  })

  it('o toque duplo do próprio mesário é sucesso, não alarme', () => {
    const resultado = resultadoDaValidacao(
      { erro: jaValidado(anterior(ANA, '2027-12-12T01:14:00Z')) },
      ANA,
      AGORA,
    )

    expect(resultado.tom).toBe('entrou')
    expect(resultado.detalhe).toBe('Por você, agora há pouco.')
  })

  it('o mesmo mesário, horas depois, é outra pessoa com o mesmo print', () => {
    const resultado = resultadoDaValidacao(
      { erro: jaValidado(anterior(ANA, '2027-12-11T23:00:00Z')) },
      ANA,
      AGORA,
    )

    expect(resultado.tom).toBe('barrado')
  })

  it('outro evento e fora do horário são aviso; revogado é barrado', () => {
    expect(resultadoDaValidacao(conflito('festa.outro_evento'), ANA).tom).toBe('aviso')
    expect(resultadoDaValidacao(conflito('festa.fora_da_janela'), ANA).tom).toBe('aviso')
    expect(resultadoDaValidacao(conflito('festa.convite_revogado'), ANA).tom).toBe('barrado')
  })

  it('sem internet, oferece registrar a entrada no celular', () => {
    expect(resultadoDaValidacao({ erro: new ErroDeRede() }, ANA).semRede).toBe(true)
  })
})
