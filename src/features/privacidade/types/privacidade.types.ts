import type { ConsentimentoDoUsuario } from '@/types/legal'
import type { EmergenciaDoTitular, EnderecoDoTitular } from '@/types/perfil'

/** O que o titular pediu. */
export type TipoDeSolicitacao = 'Exportacao' | 'Exclusao'

/** Em que pé está a solicitação. */
export type StatusDaSolicitacao = 'Pendente' | 'Concluida' | 'Cancelada' | 'Falhou'

/** A conta: o que existe uma vez por pessoa, e não por turma. */
export interface DadosDaConta {
  id: string
  nome: string
  email: string
  email_confirmado: boolean
  telefone: string | null
  criado_em: string
  /** Quando a conta foi anonimizada por pedido de eliminação. */
  anonimizado_em: string | null
}

/** O cadastro de uma turma, campo a campo. */
export interface PerfilExportado {
  nome_completo: string | null
  nome_no_diploma: string | null
  cpf: string | null
  rg: string | null
  matricula: string | null
  telefone: string | null
  data_de_nascimento: string | null
  observacoes: string | null
  endereco: EnderecoDoTitular
  contato_de_emergencia: EmergenciaDoTitular
  tem_foto: boolean
  completude: number
}

/** Uma parcela do titular. */
export interface MinhaParcela {
  id: string
  item: string
  numero: number
  vencimento: string
  valor_original_em_centavos: number
  status: string
  valor_pago_em_centavos: number | null
  pago_em: string | null
}

/** O financeiro do titular numa turma. */
export interface MeuFinanceiro {
  total_em_centavos: number
  pago_em_centavos: number
  parcelas: MinhaParcela[]
}

/** O aceite do termo — prova de contrato, e por isso não é anonimizável. */
export interface MinhaAdesao {
  versao: number
  aceito_em: string
  endereco_ip: string
}

/** O que a pessoa tem dentro de uma turma. */
export interface MeusDadosDaTurma {
  formatura_id: string
  formatura: string
  instituicao: string
  papel: string
  ativo: boolean
  perfil: PerfilExportado | null
  financeiro: MeuFinanceiro
  adesao: MinhaAdesao | null
}

/** Uma preferência de notificação do titular. */
export interface MinhaPreferencia {
  formatura_id: string
  tipo: string
  ativa: boolean
}

/** Preferências de comunicação e o que já foi mandado. */
export interface MinhasComunicacoes {
  preferencias: MinhaPreferencia[]
  notificacoes_enviadas: number
  ultima_enviada_em: string | null
}

/** Tudo o que a Kapa guarda sobre o titular, por seção. */
export interface MeusDados {
  conta: DadosDaConta
  turmas: MeusDadosDaTurma[]
  consentimentos: ConsentimentoDoUsuario[]
  comunicacoes: MinhasComunicacoes
}

/** Uma solicitação do titular, como a tela a lista. */
export interface SolicitacaoDePrivacidade {
  id: string
  tipo: TipoDeSolicitacao
  status: StatusDaSolicitacao
  criado_em: string
  prazo_em: string
  confirmada_em: string | null
  concluida_em: string | null
  expira_em: string | null
  disponivel: boolean
  motivo: string | null
}

/** Um terceiro que trata dado pessoal por conta da Kapa. */
export interface Operador {
  nome: string
  finalidade: string
  dados: string
}

/** O rótulo de cada tipo de pedido, no singular e em maiúscula inicial. */
export const ROTULOS_DE_SOLICITACAO: Record<TipoDeSolicitacao, string> = {
  Exportacao: 'Exportação dos meus dados',
  Exclusao: 'Eliminação dos meus dados',
}

/** O rótulo de cada situação, como a tela a mostra. */
export const ROTULOS_DE_STATUS: Record<StatusDaSolicitacao, string> = {
  Pendente: 'Em andamento',
  Concluida: 'Concluída',
  Cancelada: 'Cancelada',
  Falhou: 'Não deu certo',
}
