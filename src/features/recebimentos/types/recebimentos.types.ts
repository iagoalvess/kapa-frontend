export type TipoDeChavePix = 'Cpf' | 'Cnpj' | 'Email' | 'Telefone' | 'Aleatoria'

/** A conta de recebimento gravada. A API omite nulo: conta não conferida vem sem `conferida_em`. */
export interface ContaDeRecebimento {
  tipo_de_chave: TipoDeChavePix
  /** No formato do diretório do PIX: CPF só dígitos, celular em `+55…`. */
  chave: string
  nome_do_titular: string
  cidade: string
  atualizada_em: string
  conferida_em?: string
  conferida_por?: string
}

/** A conta da turma. Sem `conta`, a comissão ainda não cadastrou a chave. */
export interface ContaDeRecebimentoDaTurma {
  conta?: ContaDeRecebimento
}

export interface DadosDaConta {
  tipo_de_chave: TipoDeChavePix
  chave: string
  nome_do_titular: string
  cidade: string
}

export interface PixDeTeste {
  copia_e_cola: string
  valor_em_centavos: number
}
