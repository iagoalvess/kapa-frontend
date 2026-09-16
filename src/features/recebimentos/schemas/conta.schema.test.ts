import { describe, expect, it } from 'vitest'
import { esquemaDaConta } from './conta.schema'

const valida = {
  tipo_de_chave: 'Cpf',
  chave: '529.982.247-25',
  nome_do_titular: 'Ana Souza',
  cidade: 'Curitiba',
}

/** O primeiro motivo apontado para a chave, ou nada. */
const motivoDaChave = (dados: Record<string, string>) =>
  esquemaDaConta.safeParse({ ...valida, ...dados }).error?.issues.find((i) => i.path[0] === 'chave')?.message

describe('esquemaDaConta', () => {
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

  it('pede a chave, o titular e a cidade', () => {
    const erros = esquemaDaConta.safeParse({
      tipo_de_chave: 'Cpf',
      chave: ' ',
      nome_do_titular: '',
      cidade: '',
    }).error
    expect(erros?.issues.map((i) => i.path[0])).toEqual(['chave', 'nome_do_titular', 'cidade'])
  })
})
