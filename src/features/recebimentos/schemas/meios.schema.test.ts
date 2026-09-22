import { describe, expect, it } from 'vitest'
import { esquemaDosMeios, type FormularioDosMeios, nenhumMeioMarcado, paraMeios } from './meios.schema'

const valido: FormularioDosMeios = {
  pix_ativo: true,
  pix: {
    tipo_de_chave: 'Cpf',
    chave: '529.982.247-25',
    nome_do_titular: 'Ana Souza',
    cidade: 'Curitiba',
  },
  transferencia_ativo: false,
  transferencia: { banco: '', agencia: '', conta: '', tipo_de_conta: 'Corrente', titular: '' },
  dinheiro_ativo: false,
  dinheiro: { nome: '', onde: '' },
}

const conferir = (mudancas: Partial<FormularioDosMeios>) =>
  esquemaDosMeios.safeParse({ ...valido, ...mudancas }).error?.issues ?? []

/** O primeiro motivo apontado para a chave PIX, ou nada. */
const motivoDaChave = (pix: Partial<FormularioDosMeios['pix']>) =>
  conferir({ pix: { ...valido.pix, ...pix } }).find((i) => i.path.join('.') === 'pix.chave')?.message

describe('esquemaDosMeios', () => {
  it('confere o desenho da chave pelo tipo — o dígito verificador é do backend', () => {
    expect(motivoDaChave({})).toBeUndefined()
    expect(motivoDaChave({ chave: '529.982.247-24' })).toBeUndefined()
    expect(motivoDaChave({ chave: '5299822472' })).toBe('CPF inválido: confira os 11 dígitos.')
    expect(motivoDaChave({ tipo_de_chave: 'Cnpj', chave: '12.ABC.345/01DE-35' })).toBeUndefined()
    expect(motivoDaChave({ tipo_de_chave: 'Email', chave: 'tesouraria@turma' })).toBe('E-mail inválido.')
    expect(motivoDaChave({ tipo_de_chave: 'Telefone', chave: '+55 (41) 99876-5432' })).toBeUndefined()
    expect(motivoDaChave({ tipo_de_chave: 'Telefone', chave: '99876-5432' })).toBe(
      'Informe o celular com DDD, como (41) 99876-5432.',
    )
    expect(motivoDaChave({ tipo_de_chave: 'Aleatoria', chave: '123e4567' })).toMatch(/formato/)
  })

  it('o meio ligado pede os campos dele, no caminho que o backend também usa', () => {
    const erros = conferir({
      pix: { ...valido.pix, chave: ' ', nome_do_titular: '', cidade: '' },
      transferencia_ativo: true,
    })

    expect(erros.map((i) => i.path.join('.'))).toEqual([
      'pix.chave',
      'pix.nome_do_titular',
      'pix.cidade',
      'transferencia.banco',
      'transferencia.agencia',
      'transferencia.conta',
      'transferencia.titular',
    ])
  })

  /** O erro do campo que ninguém vai preencher é o que faria a pessoa desistir de desligar o meio. */
  it('meio desligado não cobra campo nenhum', () => {
    expect(conferir({ dinheiro_ativo: false, transferencia_ativo: false })).toEqual([])
  })

  it('sem meio nenhum, a conta não existe', () => {
    expect(nenhumMeioMarcado(valido)).toBe(false)
    expect(nenhumMeioMarcado({ ...valido, pix_ativo: false })).toBe(true)
    expect(nenhumMeioMarcado({ ...valido, pix_ativo: false, dinheiro_ativo: true })).toBe(false)
  })

  /** É o `null` que diz ao backend "a turma não aceita" — e é o que some da tela do formando. */
  it('paraMeios manda null no meio desligado', () => {
    const meios = paraMeios({
      ...valido,
      dinheiro_ativo: true,
      dinheiro: { nome: 'Ana Souza', onde: '  ' },
    })

    expect(meios.transferencia).toBeNull()
    expect(meios.dinheiro).toEqual({ nome: 'Ana Souza', onde: null })
    expect(meios.pix?.chave).toBe('529.982.247-25')
  })
})
