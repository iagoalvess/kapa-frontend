/** Os ciclos na ordem do alternador da vitrine — o do app e o da página institucional. */
export const CICLOS = ['Mensal', 'Anual'] as const

/** Periodicidade da cobrança de um plano. Espelha `CicloDeCobranca`. */
export type CicloDeCobranca = (typeof CICLOS)[number]

/**
 * Um plano do catálogo da plataforma. Espelha `PlanoDTO`.
 *
 * Mora aqui, e não na feature de assinaturas, porque duas telas o consomem: a vitrine de planos
 * dentro do app e a tabela de preços da página institucional (Sprint 16). O preço da landing tem de
 * sair da mesma origem do checkout, senão a página promete um valor que a cobrança não pratica.
 */
export interface Plano {
  id: string
  codigo: string
  nome: string
  /** Uma linha embaixo do nome, no card: para que turma o plano serve. */
  descricao: string
  /** Inteiro, em centavos: `34990` é R$ 349,90. Converta só na exibição (`formatarCentavos`). */
  preco_em_centavos: number
  /** Preço sem desconto, o valor riscado. Nulo quando não há desconto. */
  preco_cheio_em_centavos: number | null
  ciclo: CicloDeCobranca
  limite_de_formandos: number
  /** Módulos incluídos, na ordem de exibição. */
  modulos: string[]
  recomendado: boolean
}

/**
 * Quanto por cento o plano economiza em relação ao preço cheio, ou nulo quando não há desconto.
 *
 * A conta sai dos dois valores que o backend manda, e não de um número escrito na tela: a
 * porcentagem anunciada precisa vir da mesma tabela que cobra.
 *
 * @param plano Plano do catálogo.
 */
export function descontoDoPlano(plano: Plano) {
  const cheio = plano.preco_cheio_em_centavos

  if (typeof cheio !== 'number' || cheio <= plano.preco_em_centavos) return null

  return Math.round((1 - plano.preco_em_centavos / cheio) * 100)
}

/**
 * O maior desconto do catálogo, em porcentagem inteira — o "Economize X%" da pílula do ciclo. Zero
 * quando nenhum plano tem desconto.
 *
 * @param planos Os planos que a pílula representa.
 */
export function maiorDesconto(planos: readonly Plano[]) {
  return Math.max(0, ...planos.map((plano) => descontoDoPlano(plano) ?? 0))
}

/**
 * O plano que vale para a turma agora. Espelha `PlanoDaTurmaDTO` (Sprint 45).
 *
 * Sempre há um: o contratado ou o gratuito. É com ele que a tela tranca a área fora do plano antes de
 * chamar a API — quem recusa continua sendo a API.
 */
export interface PlanoDaTurma {
  codigo: string
  nome: string
  /** Códigos dos módulos que o plano libera — ver `MODULOS` em `config/planos`. */
  modulos: string[]
  /** Plano contratado em dia. Falso no gratuito, e a turma vencida volta a ele. */
  pago: boolean
}
