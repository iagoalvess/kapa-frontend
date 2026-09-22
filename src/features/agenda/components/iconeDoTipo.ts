import { CalendarClock, GraduationCap, type LucideIcon, PartyPopper, Timer, Users } from 'lucide-react'
import type { TipoDeEvento } from '@/types/agenda'

/**
 * O ícone de cada tipo.
 *
 * **Não** entra no cartão da agenda: lá o cartão é estreito, o tipo está escrito na última linha e
 * a cor é da situação. Serve ao bloco da Página Inicial e ao diálogo, onde há um evento por vez e
 * o ícone é o que o distingue de relance.
 *
 * Mora fora dos componentes porque dois deles desenham o mesmo evento, e duas cópias do mapa é o
 * caminho para a colação virar birrete num lugar e relógio no outro.
 *
 * A colação e a festa repetem os ícones que a Página Inicial já usa: é a mesma data, vista de
 * outra tela.
 */
export const ICONE_DO_TIPO = {
  Colacao: GraduationCap,
  Festa: PartyPopper,
  Reuniao: Users,
  Prazo: Timer,
  Outro: CalendarClock,
} as const satisfies Record<TipoDeEvento, LucideIcon>
