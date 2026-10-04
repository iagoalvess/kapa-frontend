import { CalendarClock, GraduationCap, type LucideIcon, PartyPopper, Timer, Users } from 'lucide-react'
import type { TipoDeEvento } from '@/types/agenda'

/**
 * O ícone de cada tipo.
 *
 * Vai na pílula do tipo, no cartão da agenda, no bloco da Página Inicial e no diálogo: o ícone é o
 * que distingue uma reunião de um prazo de relance. A cor fica com a situação.
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

/**
 * A cor da pílula do tipo, no cartão da agenda — como no modelo, cada tipo com a sua.
 *
 * Reunião, prazo e outro saem dos tokens de estado; colação e festa, que não têm token claro próprio,
 * saem da paleta dos avatares, esmaecida. Escritas por extenso: o scanner do Tailwind lê o código
 * como texto, e classe montada em template não seria gerada.
 */
export const COR_DO_TIPO = {
  Colacao: 'bg-avatar-4/20 text-foreground',
  Festa: 'bg-avatar-3/20 text-foreground',
  Reuniao: 'bg-success-bg text-success-text',
  Prazo: 'bg-warning-bg text-warning-text',
  Outro: 'bg-neutral-bg text-neutral-text',
} as const satisfies Record<TipoDeEvento, string>

/**
 * A cor do **ponto** do tipo — a bolinha que marca a data nas listas do Início e da agenda.
 *
 * São os tokens `--evento-*`, um matiz por tipo, os mesmos da barra do cartão da agenda. Escritos por
 * extenso: o scanner do Tailwind lê o código como texto, e classe montada em template não sairia.
 */
export const PONTO_DO_TIPO = {
  Colacao: 'bg-evento-colacao',
  Festa: 'bg-evento-festa',
  Reuniao: 'bg-evento-reuniao',
  Prazo: 'bg-evento-prazo',
  Outro: 'bg-evento-outro',
} as const satisfies Record<TipoDeEvento, string>
