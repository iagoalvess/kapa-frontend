/** Periodicidade da cobrança de um plano. Espelha `CicloDeCobranca`. */
export type CicloDeCobranca = 'Mensal' | 'Anual'

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
  /** Preço sem desconto, o valor riscado. Ausente quando não há desconto. */
  preco_cheio_em_centavos?: number
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
