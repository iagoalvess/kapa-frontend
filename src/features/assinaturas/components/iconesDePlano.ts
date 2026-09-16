import { Landmark, type LucideIcon, Package, Rocket, Sprout } from 'lucide-react'

/**
 * O ícone de cada plano do catálogo, pelo código.
 *
 * Mora fora do card porque a barra lateral mostra o ícone do plano contratado, e tem que ser o
 * mesmo desenho: dois ícones para a mesma coisa fazem o menu parecer levar a outro lugar. Escolher
 * por posição na vitrine funcionava no card, mas a barra não sabe a posição de nada.
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
