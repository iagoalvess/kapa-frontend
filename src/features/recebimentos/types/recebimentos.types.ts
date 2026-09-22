import type { DadosBancarios } from '@/types/recebimento'

export type { DadosBancarios, MeioDeRecebimento } from '@/types/recebimento'

export type TipoDeChavePix = 'Cpf' | 'Cnpj' | 'Email' | 'Telefone' | 'Aleatoria'

/** A chave PIX da turma. Espelha `ChavePixDTO`. */
export interface ChavePix {
  tipo_de_chave: TipoDeChavePix
  /** Na volta, no formato do diretório do PIX: CPF só dígitos, celular em `+55…`. */
  chave: string
  nome_do_titular: string
  cidade: string
}

/** Com quem o formando fala para pagar em espécie. Espelha `DinheiroDTO`. */
export interface DinheiroCom {
  nome: string
  onde: string | null
}

/** Os meios que a turma aceita. Meio nulo é meio desligado. Espelha `MeiosDaContaDTO`. */
export interface MeiosDaConta {
  pix: ChavePix | null
  transferencia: DadosBancarios | null
  dinheiro: DinheiroCom | null
}

/** A conta de recebimento gravada. Espelha `ContaDeRecebimentoDTO`. */
export interface ContaDeRecebimento {
  meios: MeiosDaConta
  atualizada_em: string
  /** Quando o Presidente conferiu o titular do PIX; nulo enquanto não conferiu. */
  conferida_em: string | null
  conferida_por: string | null
}

/** A conta da turma. Sem `conta`, a comissão ainda não habilitou meio nenhum. */
export interface ContaDeRecebimentoDaTurma {
  conta: ContaDeRecebimento | null
}

export interface PixDeTeste {
  copia_e_cola: string
  valor_em_centavos: number
}
