import { describe, expect, it } from 'vitest'
import type { PerfilDoFormando } from '../types/formandos.types'
import { comDadosDoTitular, esquemaDoTitular } from './perfil.schema'

/** Como a API devolve: campo vazio não vem (`WhenWritingNull`). */
const perfil: PerfilDoFormando = {
  usuario_id: 'u-1',
  nome: 'Ana',
  email: 'ana@kapa.dev',
  papel: 'Formando',
  pessoais: { nome_completo: 'Ana Souza', telefone: '+5541998765432', rg: '12.345.678-9' },
  endereco: {},
  contato_de_emergencia: {},
  completude: 30,
  faltando: ['cpf', 'data_de_nascimento'],
  essencial_pendente: true,
}

describe('dados do titular para a adesão', () => {
  /** Seção enviada é seção substituída: mandar só os três campos apagaria o resto do que já estava lá. */
  it('mandam a seção pessoal inteira, com o que o cadastro já tinha', () => {
    const corpo = comDadosDoTitular(perfil, {
      pessoais: { nome_completo: 'Ana Souza', cpf: '529.982.247-25', data_de_nascimento: '2000-05-20' },
    })

    expect(corpo.pessoais).toMatchObject({
      nome_completo: 'Ana Souza',
      cpf: '529.982.247-25',
      data_de_nascimento: '2000-05-20',
      telefone: '(41) 99876-5432',
      rg: '12.345.678-9',
      matricula: null,
    })
  })

  it('exigem os três campos, ao contrário do cadastro', () => {
    const resultado = esquemaDoTitular.safeParse({
      pessoais: { nome_completo: '', cpf: '123', data_de_nascimento: '' },
    })

    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues.map((issue) => issue.path.join('.'))).toEqual([
      'pessoais.nome_completo',
      'pessoais.cpf',
      'pessoais.data_de_nascimento',
    ])
  })
})
