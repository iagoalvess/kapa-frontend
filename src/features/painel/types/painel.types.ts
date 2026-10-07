import type { ComunicacaoDoKapa } from '@/types/comunicacaoDoKapa'
import type { CobrancaDoPlano } from '@/types/assinatura'
import type { PaginacaoRequest } from '@/types/paginacao'

/** As contas da plataforma. Espelha `ContasDaPlataformaDTO`. */
export interface ContasDaPlataforma {
  total: number
  no_periodo: number
  confirmadas: number
  /** Sem vínculo ativo em turma nenhuma — cadastrou e parou. */
  sem_turma: number
}

/** Quantas turmas numa licença. Espelha `TurmasNaLicencaDTO`. */
export interface TurmasNaLicenca {
  /** `Gratuito`, o nome do plano pago, ou o status da turma parada. */
  licenca: string
  turmas: number
}

/** As turmas da plataforma. Espelha `TurmasDaPlataformaDTO`. */
export interface TurmasDaPlataforma {
  total: number
  novas_no_periodo: number
  /** Com assinatura em dia (P4). */
  pagantes: number
  por_licenca: TurmasNaLicenca[]
  membros_por_turma_media: number
  membros_por_turma_mediana: number
}

/** A receita do Kapa: as assinaturas (P1). Espelha `DinheiroDoKapaDTO`. */
export interface DinheiroDoKapa {
  assinaturas: number
  mrr_em_centavos: number
  recebido_em_centavos: number
  a_vencer_em_centavos: number
  estornado_em_centavos: number
}

/** O dinheiro das turmas, só agregado. Não é receita do Kapa. Espelha `DinheiroDasTurmasDTO`. */
export interface DinheiroDasTurmas {
  parcelas_pagas: number
  pago_em_centavos: number
  parcelas_a_receber: number
  a_receber_em_centavos: number
}

/** Um recurso no ranking de uso (P2). Espelha `UsoDoRecursoDTO`. */
export interface UsoDoRecurso {
  recurso: string
  eventos: number
  turmas: number
  usuarios: number
}

/** Como a plataforma está no período. Espelha `AnalyticsDaPlataformaDTO`. */
export interface AnalyticsDaPlataforma {
  de: string
  ate: string
  contas: ContasDaPlataforma
  formaturas: TurmasDaPlataforma
  kapa: DinheiroDoKapa
  turmas: DinheiroDasTurmas
  uso: UsoDoRecurso[]
}

/** Um mês da série. Espelha `MesDaPlataformaDTO`. */
export interface MesDaPlataforma {
  ano: number
  mes: number
  cadastros: number
  turmas_novas: number
  recebido_em_centavos: number
}

/** Uma turma na lista do painel. Espelha `TurmaNoPainelDTO`. */
export interface TurmaNoPainel {
  id: string
  nome: string
  instituicao: string
  curso: string
  status: string
  licenca: string
  membros: number
  criada_em: string
}

/** Uma conta na lista do painel. Espelha `ContaNoPainelDTO`. */
export interface ContaNoPainel {
  id: string
  nome: string
  email: string
  ativo: boolean
  email_confirmado: boolean
  bloqueado_ate: string | null
  turmas: number
  criado_em: string
}

/** As situações do filtro de contas. Espelha `SituacaoDaConta`. */
export const SITUACOES_DA_CONTA = {
  Confirmada: 'Confirmadas',
  Bloqueada: 'Bloqueadas',
  Desativada: 'Desativadas',
} as const

export type SituacaoDaConta = keyof typeof SITUACOES_DA_CONTA

export interface FiltroDeTurmas extends PaginacaoRequest {
  termo?: string
  licenca?: string
}

export interface FiltroDeContas extends PaginacaoRequest {
  termo?: string
  situacao?: SituacaoDaConta
}

/** A licença da turma, como o suporte a vê. Espelha `AssinaturaNoSuporteDTO`. */
export interface AssinaturaNoSuporte {
  id: string
  plano_nome: string
  limite_de_formandos: number
  status: string
  vigente_ate: string | null
  cancelada_em: string | null
  contratada_em: string
}

/**
 * Um membro da turma, como o suporte o vê. Espelha `MembroNoSuporteDTO`.
 *
 * O CPF chega **mascarado** da API (`***.982.247-**`). Não existe endpoint no painel que devolva o
 * número inteiro — quem atende não precisa dele para dizer por que o pagamento não entrou.
 */
export interface MembroNoSuporte {
  usuario_id: string
  nome: string
  email: string
  papel: string
  ativo: boolean
  desligado_em: string | null
  cpf: string | null
}

/** A turma inteira, como o suporte a vê. Espelha `TurmaNoSuporteDTO`. Os membros vêm paginados à parte. */
export interface TurmaNoSuporte {
  id: string
  nome: string
  instituicao: string
  curso: string
  ano: number
  semestre: number
  status: string
  criada_em: string
  ativada_em: string | null
  assinatura: AssinaturaNoSuporte | null
  membros_ativos: number
  parcelas: number
  parcelas_pagas: number
  adesoes: number
  /** Os pagamentos do plano, mais recentes primeiro — de onde o suporte estorna (Sprint 37). */
  pagamentos: CobrancaDoPlano[]
}

/**
 * Como o suporte estorna um pagamento do plano (P7): tudo de volta nos 7 dias da desistência, ou o que falta do
 * ciclo nos casos das seções 13 e 14 dos Termos. Espelha `ModoDeEstorno`.
 */
export type ModoDeEstorno = 'Integral' | 'Proporcional'

/** Uma turma de que a pessoa participa. Espelha `VinculoNoSuporteDTO`. */
export interface VinculoNoSuporte {
  formatura_id: string
  nome: string
  instituicao: string
  status: string
  papel: string
  ativo: boolean
  desligado_em: string | null
}

/** A conta inteira, como o suporte a vê. Espelha `UsuarioNoSuporteDTO`. */
export interface UsuarioNoSuporte {
  id: string
  nome: string
  email: string
  email_confirmado: boolean
  ativo: boolean
  bloqueado_ate: string | null
  tentativas_falhas: number
  perfis: string[]
  anonimizado_em: string | null
  criado_em: string
  vinculos: VinculoNoSuporte[]
  /** Se recebe as novidades do Kapa, e os últimos e-mails de marketing (Sprint 40). */
  comunicacao_do_kapa: ComunicacaoDoKapa
}

/** As ações que o painel executa sobre uma conta. O caminho é o próprio nome no backend. */
export type AcaoNaConta = 'reenviar-confirmacao' | 'redefinir-senha' | 'desbloquear'

/** Um cupom de desconto da primeira cobrança (Sprint 51). Espelha `CupomDTO`. */
export interface Cupom {
  id: string
  codigo: string
  /** De 1 a 50. */
  percentual: number
  /** Último instante em que vale, em UTC. */
  valido_ate: string
  limite_de_usos: number
  usos: number
  /** Falso depois de desativado. */
  ativo: boolean
  criado_em: string
}

/** Corpo do cupom novo. Espelha `NovoCupomRequestDTO`. */
export interface NovoCupom {
  codigo: string
  percentual: number
  /** `aaaa-mm-dd`, o último dia em que vale. */
  valido_ate: string
  limite_de_usos: number
}
