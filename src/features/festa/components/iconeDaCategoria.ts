import {
  Camera,
  Coins,
  FileText,
  GraduationCap,
  Landmark,
  type LucideIcon,
  Mail,
  Music,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'
import type { CategoriaDeDespesa } from '@/types/financeiro'

/**
 * O ícone de cada categoria — o mesmo vocabulário visual das despesas.
 *
 * Mora fora dos componentes porque a linha da lista e o painel de detalhe desenham o mesmo item, e
 * duas cópias do mapa é o caminho para a banda virar violão de um lado e microfone do outro.
 */
export const ICONE_DA_CATEGORIA = {
  Buffet: UtensilsCrossed,
  Espaco: Landmark,
  Banda: Music,
  Fotografia: Camera,
  Decoracao: Sparkles,
  Convites: Mail,
  Beca: GraduationCap,
  Taxas: Coins,
  Outros: FileText,
} as const satisfies Record<CategoriaDeDespesa, LucideIcon>
