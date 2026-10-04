import {
  Columns3,
  DoorOpen,
  LogOut,
  type LucideIcon,
  Martini,
  MicVocal,
  Music,
  Speaker,
  SquareDashed,
  Toilet,
  UtensilsCrossed,
} from 'lucide-react'
import type { CorDaArea, TipoDeElemento } from '../types/mesas.types'

/**
 * O que a comissão pode pôr no salão além das mesas, com o nome, o ícone e o tamanho com que cada um
 * nasce (em centímetros).
 *
 * A lista é fixa porque ícone é código. O que não está nela vira uma Área com o nome que a turma
 * quiser — "Cabine de fotos", "Família" —, e é assim que o mesmo mapa serve a qualquer salão.
 */
export const ELEMENTOS_DO_SALAO: Record<
  TipoDeElemento,
  { rotulo: string; icone: LucideIcon; largura: number; altura: number }
> = {
  Palco: { rotulo: 'Palco', icone: MicVocal, largura: 480, altura: 200 },
  Pista: { rotulo: 'Pista de dança', icone: Music, largura: 400, altura: 400 },
  Som: { rotulo: 'DJ', icone: Speaker, largura: 160, altura: 100 },
  Bar: { rotulo: 'Bar', icone: Martini, largura: 240, altura: 100 },
  Buffet: { rotulo: 'Buffet', icone: UtensilsCrossed, largura: 300, altura: 100 },
  Banheiro: { rotulo: 'Banheiros', icone: Toilet, largura: 220, altura: 180 },
  Entrada: { rotulo: 'Entrada', icone: DoorOpen, largura: 160, altura: 40 },
  Saida: { rotulo: 'Saída', icone: LogOut, largura: 160, altura: 40 },
  Area: { rotulo: 'Área', icone: SquareDashed, largura: 400, altura: 300 },
  Divisoria: { rotulo: 'Divisória', icone: Columns3, largura: 300, altura: 40 },
}

/** A ordem da paleta "Adicionar": o que quase todo salão tem vem primeiro. */
export const TIPOS_DE_ELEMENTO = Object.keys(ELEMENTOS_DO_SALAO) as TipoDeElemento[]

/**
 * As cores da área: preenchimento claro e borda da mesma cor, para o setor se ler sem esconder as
 * mesas que estão em cima dele. `amostra` pinta o botão da escolha.
 */
export const CORES_DA_AREA: Record<CorDaArea, { rotulo: string; desenho: string; amostra: string }> = {
  Laranja: { rotulo: 'Laranja', desenho: 'fill-brand/10 stroke-brand-soft', amostra: 'bg-brand-tint' },
  Amarelo: {
    rotulo: 'Amarelo',
    desenho: 'fill-evento-prazo/10 stroke-evento-prazo/60',
    amostra: 'bg-evento-prazo/25',
  },
  Lilas: {
    rotulo: 'Lilás',
    desenho: 'fill-evento-festa/10 stroke-evento-festa/70',
    amostra: 'bg-evento-festa/30',
  },
  Cinza: {
    rotulo: 'Cinza',
    desenho: 'fill-neutral-bg/60 stroke-muted-foreground/40',
    amostra: 'bg-neutral-bg',
  },
}
