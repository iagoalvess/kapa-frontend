import type { Papel } from '@/config/perfis'

/** Seção de dados pessoais. Espelha `DadosPessoaisDTO`. */
export interface DadosPessoais {
  nome_completo: string | null
  nome_no_diploma: string | null
  /** Só os 11 dígitos. */
  cpf: string | null
  rg: string | null
  matricula: string | null
  /** Em E.164: `+5541998765432`. */
  telefone: string | null
  /** `aaaa-mm-dd`. */
  data_de_nascimento: string | null
  observacoes: string | null
}

/** Seção de endereço. Espelha `DadosDeEnderecoDTO`. */
export interface DadosDeEndereco {
  /** Só os 8 dígitos. */
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
}

/** Seção de contato de emergência. Espelha `DadosDeEmergenciaDTO`. */
export interface DadosDeEmergencia {
  nome: string | null
  telefone: string | null
  parentesco: string | null
}

/** Itens que a completude conta, como a API os nomeia em `faltando`. */
export type ItemDoCadastro =
  | 'nome_completo'
  | 'nome_no_diploma'
  | 'cpf'
  | 'rg'
  | 'matricula'
  | 'telefone'
  | 'data_de_nascimento'
  | 'endereco'
  | 'contato_de_emergencia'
  | 'foto'

/** O cadastro inteiro. Espelha `PerfilDoFormandoDTO`. */
export interface PerfilDoFormando {
  usuario_id: string
  /** Nome de exibição da conta. */
  nome: string
  email: string
  papel: Papel
  pessoais: DadosPessoais
  endereco: DadosDeEndereco
  contato_de_emergencia: DadosDeEmergencia
  /** Baixado por `/arquivos/{id}/conteudo` — só o dono consegue. */
  foto_arquivo_id: string | null
  /** De 0 a 100. */
  completude: number
  faltando: ItemDoCadastro[]
  /** Falta nome completo, CPF ou telefone. */
  essencial_pendente: boolean
}

/**
 * Corpo da gravação. Seção ausente não é tocada — é o que deixa cada seção salvar sozinha.
 * Campo vazio vai `null`, que apaga.
 */
export interface AtualizarPerfil {
  pessoais?: DadosPessoais
  endereco?: DadosDeEndereco
  contato_de_emergencia?: DadosDeEmergencia
}
