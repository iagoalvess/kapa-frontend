import { describe, expect, it } from 'vitest'
import type { PerfilDoFormando } from '../types/formandos.types'
import { comDadosDoTitular, esquemaDoTitular } from './perfil.schema'

/** Como a API devolve: campo vazio vem `null`. */
const perfil: PerfilDoFormando = {
  usuario_id: 'u-1',
  nome: 'Ana',
  email: 'ana@kapa.dev',
  papel: 'Formando',
  pessoais: {
    nome_completo: 'Ana Souza',
    cpf: null,
    telefone: '+5541998765432',
  },
  contato_de_emergencia: { nome: null, telefone: null, parentesco: null },
  foto_arquivo_id: null,
  completude: 40,
  faltando: ['cpf', 'contatoDeEmergencia', 'foto'],
  essencial_pendente: true,
}

describe('dados do titular para a adesão', () => {
  /** Seção enviada é seção substituída: mandar só nome e CPF apagaria o telefone que já estava lá. */
  it('mandam a seção pessoal inteira, com o que o cadastro já tinha', () => {
    const corpo = comDadosDoTitular(perfil, {
      pessoais: { nome_completo: 'Ana Souza', cpf: '529.982.247-25' },
    })

    expect(corpo.pessoais).toMatchObject({
      nome_completo: 'Ana Souza',
      cpf: '529.982.247-25',
      telefone: '(41) 99876-5432',
    })
  })

  it('exigem nome e CPF, ao contrário do cadastro', () => {
    const resultado = esquemaDoTitular.safeParse({
      pessoais: { nome_completo: '', cpf: '123' },
    })

    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues.map((issue) => issue.path.join('.'))).toEqual([
      'pessoais.nome_completo',
      'pessoais.cpf',
    ])
  })
})
