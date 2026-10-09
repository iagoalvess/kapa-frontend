import type { ComunicacaoDoKapa } from '@/types/comunicacaoDoKapa'
import type { ConsentimentoDoUsuario } from '@/types/legal'

/*
  As seções do cadastro como o portal de privacidade as recebe: anuláveis, e não opcionais —
  a API escreve o nulo (ver `backend/docs/contrato.md`).
*/

/** Contato de emergência, como o portal de privacidade o lê. */
interface EmergenciaDoTitular {
  nome: string | null
  /** Em E.164: `+5541998765432`. */
  telefone: string | null
  parentesco: string | null
}

/** O que o titular pediu. */
export type TipoDeSolicitacao = 'Exportacao' | 'Exclusao'

/** Em que pé está a solicitação. */
export type StatusDaSolicitacao = 'Pendente' | 'Concluida' | 'Cancelada' | 'Falhou'

/** A conta: o que existe uma vez por pessoa, e não por turma. */
interface DadosDaConta {
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
interface PerfilExportado {
  nome_completo: string | null
  cpf: string | null
  telefone: string | null
  contato_de_emergencia: EmergenciaDoTitular
  tem_foto: boolean
  completude: number
}

/** Uma parcela do titular. */
interface MinhaParcela {
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
interface MeuFinanceiro {
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

/** O que já foi mandado e as novidades do Kapa. */
interface MinhasComunicacoes {
  notificacoes_enviadas: number
  ultima_enviada_em: string | null
  /** "Receber novidades do Kapa" (Sprint 40). */
  do_kapa: ComunicacaoDoKapa
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
