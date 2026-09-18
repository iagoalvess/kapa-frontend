import { Landmark, type LucideIcon, Package, Rocket, Sprout } from 'lucide-react'

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
  completo: Rocket,
  'completo-anual': Rocket,
  'turma-grande': Landmark,
  'turma-grande-anual': Landmark,
}

/** Plano fora do mapa — o catálogo é editável no banco — e o menu antes de a turma contratar. */
export const ICONE_DE_PLANO_PADRAO = Package
