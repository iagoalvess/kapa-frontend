import type { Papel } from '@/config/perfis'
import type { PaginacaoRequest } from '@/types/paginacao'

/*
  A API omite campo nulo (`WhenWritingNull`): campo vazio do cadastro chega `undefined`, não
  `null`. Por isso tudo aqui é opcional.
*/

/** Seção de dados pessoais. Espelha `DadosPessoaisDTO`. */
export interface DadosPessoais {
  nomeCompleto?: string
  nomeNoDiploma?: string
  /** Só os 11 dígitos. */
  cpf?: string
  rg?: string
  matricula?: string
  /** Em E.164: `+5541998765432`. */
  telefone?: string
  /** `aaaa-mm-dd`. */
  dataDeNascimento?: string
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
  | 'nomeCompleto'
  | 'nomeNoDiploma'
  | 'cpf'
  | 'rg'
  | 'matricula'
  | 'telefone'
  | 'dataDeNascimento'
  | 'endereco'
  | 'contatoDeEmergencia'
  | 'foto'

/** O cadastro inteiro. Espelha `PerfilDoFormandoDTO`. */
export interface PerfilDoFormando {
  usuarioId: string
  /** Nome de exibição da conta. */
  nome: string
  email: string
  papel: Papel
  pessoais: DadosPessoais
  endereco: DadosDeEndereco
  contatoDeEmergencia: DadosDeEmergencia
  /** Baixado por `/arquivos/{id}/conteudo` — só o dono consegue. */
  fotoArquivoId?: string
  /** De 0 a 100. */
  completude: number
  faltando: ItemDoCadastro[]
  /** Falta nome completo, CPF ou telefone. */
  essencialPendente: boolean
}

/**
 * Corpo da gravação. Seção ausente não é tocada — é o que deixa cada seção salvar sozinha.
 * Campo vazio vai `null`, que apaga.
 */
export interface AtualizarPerfil {
  pessoais?: { [Campo in keyof DadosPessoais]-?: DadosPessoais[Campo] | null }
  endereco?: { [Campo in keyof DadosDeEndereco]-?: DadosDeEndereco[Campo] | null }
  contatoDeEmergencia?: { [Campo in keyof DadosDeEmergencia]-?: DadosDeEmergencia[Campo] | null }
}

/** Um formando na lista da comissão. Espelha `FormandoResumoDTO`. */
export interface FormandoResumo {
  usuarioId: string
  nome: string
  email: string
  papel: Papel
  nomeCompleto?: string
  completude: number
  essencialPendente: boolean
}

/** Recorte por situação do cadastro. `Pendente` é quem ainda não tem o essencial. */
export type SituacaoDoCadastro = 'Pendente' | 'Incompleto' | 'Completo'

/** Filtros de `GET /api/v1/formandos`. */
export interface FiltroDeFormandos extends PaginacaoRequest {
  /** Trecho do nome de exibição, do nome civil ou do e-mail. */
  busca?: string
  situacao?: SituacaoDoCadastro
}
