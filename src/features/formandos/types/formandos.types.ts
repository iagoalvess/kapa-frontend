import type { Papel } from '@/config/perfis'

/*
  A API omite campo nulo (`WhenWritingNull`): campo vazio do cadastro chega `undefined`, não
  `null`. Por isso tudo aqui é opcional.
*/

/** Seção de dados pessoais. Espelha `DadosPessoaisDTO`. */
export interface DadosPessoais {
  nome_completo?: string
  nome_no_diploma?: string
  /** Só os 11 dígitos. */
  cpf?: string
  rg?: string
  matricula?: string
  /** Em E.164: `+5541998765432`. */
  telefone?: string
  /** `aaaa-mm-dd`. */
  data_de_nascimento?: string
  observacoes?: string
}

/** Seção de endereço. Espelha `DadosDeEnderecoDTO`. */
export interface DadosDeEndereco {
  /** Só os 8 dígitos. */
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
}

/** Seção de contato de emergência. Espelha `DadosDeEmergenciaDTO`. */
export interface DadosDeEmergencia {
  nome?: string
  telefone?: string
  parentesco?: string
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
  foto_arquivo_id?: string
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
  pessoais?: { [Campo in keyof DadosPessoais]-?: DadosPessoais[Campo] | null }
  endereco?: { [Campo in keyof DadosDeEndereco]-?: DadosDeEndereco[Campo] | null }
  contato_de_emergencia?: { [Campo in keyof DadosDeEmergencia]-?: DadosDeEmergencia[Campo] | null }
}
