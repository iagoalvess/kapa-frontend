import { type LucideIcon, Package, Rocket, Sprout } from 'lucide-react'

/**
 * O ícone de cada plano do catálogo, pelo código.
 *
 * Mora em `config/` porque três telas o desenham: a vitrine de planos, a barra lateral (que mostra
 * o plano contratado) e a tabela de preços da página institucional. Dois ícones para a mesma coisa
 * fazem o menu parecer levar a outro lugar.
 *
 * Os dois ciclos repetem o ícone: o pacote é o mesmo, só a periodicidade muda.
 */
export const ICONES_DE_PLANO: Record<string, LucideIcon | undefined> = {
  essencial: Sprout,
  'essencial-anual': Sprout,
  premium: Rocket,
  'premium-anual': Rocket,
}

/** Plano fora do mapa — o catálogo é editável no banco — e o menu antes de a turma contratar. */
export const ICONE_DE_PLANO_PADRAO = Package

/**
 * O nome exibido de cada módulo, pelo código que vem em `plano.modulos`.
 *
 * Até 18/09/2026 a API mandava o nome pronto — e o mesmo texto era, do lado de lá, a regra de
 * acesso. Virou código quando o plano gratuito passou a existir: gate que depende de texto de
 * vitrine se abre no dia em que alguém corrige uma vírgula. O nome ficou aqui, ao lado dos ícones,
 * porque é o que ele sempre foi — copy, e copy é do front.
 */
export const NOMES_DE_MODULO: Record<string, string | undefined> = {
  membros: 'Membros e convites',
  termo: 'Termo de adesão',
  cobrancas: 'Cobranças e parcelas',
  pix: 'Recebimento PIX e conferência',
  despesas: 'Despesas e fornecedores',
  caixa: 'Caixa e relatórios',
  mural: 'Mural e acervo de documentos',
  avisos: 'Avisos e régua de cobrança',
  contabil: 'Painel e exportação contábil',
  auditoria: 'Portal LGPD e auditoria',
}

/**
 * O nome do módulo, ou o próprio código quando ele é novo aqui.
 *
 * Devolver o código cru é de propósito: módulo que o backend passou a mandar e o front ainda não
 * nomeou aparece feio, e aparecer feio é melhor que sumir da lista do que o plano inclui.
 *
 * @param codigo Código do módulo, como vem da API.
 * @returns O nome exibido.
 */
export function nomeDoModulo(codigo: string) {
  return NOMES_DE_MODULO[codigo] ?? codigo
}
