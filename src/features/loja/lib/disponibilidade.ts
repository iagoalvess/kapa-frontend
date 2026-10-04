import { jaChegou } from '@/lib/formato'
import type { ItemDaLoja } from '../types/loja.types'

/**
 * Se as vendas do convite já abriram, pelo relógio corrigido do servidor: a resposta traz o `aberto`,
 * e a abertura futura cai na hora certa mesmo entre duas leituras da vitrine (decisão 8).
 *
 * @param item O convite da loja.
 * @param agora O agora do servidor, em milissegundos (`useAgoraDoServidor`).
 */
export function estaAberto(item: ItemDaLoja, agora: number): boolean {
  return item.aberto || (item.abertura_de_vendas !== null && jaChegou(item.abertura_de_vendas, agora))
}

/**
 * Se dá para comprar agora: aberto e com lugar. O esgotado e o "em breve" ficam de fora — a tela ainda
 * os mostra no cartão, para quem chegou depois saber que existiram, mas desabilitados.
 *
 * @param item O convite da loja.
 * @param agora O agora do servidor, em milissegundos.
 */
export function aVenda(item: ItemDaLoja, agora: number): boolean {
  return estaAberto(item, agora) && item.disponivel !== 0
}
