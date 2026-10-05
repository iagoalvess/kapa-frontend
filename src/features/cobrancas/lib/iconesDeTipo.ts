import {
  Award,
  BadgeCheck,
  CalendarDays,
  Camera,
  Gem,
  Gift,
  GraduationCap,
  type LucideIcon,
  Package,
  PartyPopper,
  Receipt,
  Shirt,
  Sparkles,
  Ticket,
  UtensilsCrossed,
  Video,
} from 'lucide-react'
import type { TipoDeCobranca } from '../types/cobrancas.types'

/**
 * O ícone de cada tipo, no bloco colorido de `IconeDoTipo`.
 *
 * Um mapa só para a lista de itens do plano e para a vitrine: as duas falam do mesmo item, e o
 * ícone que muda de uma tela para a outra faz parecer que são coisas diferentes.
 */
export const ICONES_DE_TIPO: Record<TipoDeCobranca, LucideIcon> = {
  Mensalidade: CalendarDays,
  Adesao: BadgeCheck,
  Rifa: Ticket,
  ConviteExtra: PartyPopper,
  Avulsa: Receipt,
  FotoEAlbum: Camera,
  Filmagem: Video,
  Beca: GraduationCap,
  Vestuario: Shirt,
  Kit: Gift,
  Mesa: UtensilsCrossed,
  Joia: Gem,
  Outro: Package,
  Festa: Sparkles,
  Colacao: Award,
}
