import { api } from '@/lib/http/cliente'
import type { DadosDaProposta, DadosDoItemDaFesta, ItemDaFesta, Proposta } from '@/types/festa'

const ITENS = '/api/v1/festa/itens'
const PROPOSTAS = '/api/v1/festa/propostas'

/*
  Só as escritas moram aqui. As leituras — a lista dos itens e a meta — ficam em
  `hooks/useItensDaFesta`, porque a feature `financeiro` e a Página Inicial também as consomem, e
  uma feature não importa de outra.
*/

/** Cria um item no fim da lista. */
export function criarItemDaFesta(dados: DadosDoItemDaFesta) {
  return api.post<ItemDaFesta>(ITENS, { body: dados })
}

/** Corrige um item. Item cancelado devolve `festa.item_cancelado`. */
export function atualizarItemDaFesta({ id, dados }: { id: string; dados: DadosDoItemDaFesta }) {
  return api.put<ItemDaFesta>(`${ITENS}/${id}`, { body: dados })
}

/** A turma desistiu: o item sai do custo da festa e fica na lista com o selo. */
export function cancelarItemDaFesta(id: string) {
  return api.post<ItemDaFesta>(`${ITENS}/${id}/cancelamento`)
}

/** Desfaz o cancelamento — o item volta a contar no custo. */
export function reativarItemDaFesta(id: string) {
  return api.delete<ItemDaFesta>(`${ITENS}/${id}/cancelamento`)
}

/** Exclui um item sem despesa; com despesa, a API devolve `festa.item_em_uso`. */
export function excluirItemDaFesta(id: string) {
  return api.delete<void>(`${ITENS}/${id}`)
}

/** Acrescenta uma candidata ao item; item já contratado devolve `festa.disputa_encerrada`. */
export function criarProposta({ itemId, dados }: { itemId: string; dados: DadosDaProposta }) {
  return api.post<Proposta>(`${ITENS}/${itemId}/propostas`, { body: dados })
}

/** Corrige uma proposta. */
export function atualizarProposta({ id, dados }: { id: string; dados: DadosDaProposta }) {
  return api.put<Proposta>(`${PROPOSTAS}/${id}`, { body: dados })
}

/** Tira uma proposta da disputa — os votos nela vão junto. */
export function excluirProposta(id: string) {
  return api.delete<void>(`${PROPOSTAS}/${id}`)
}

/** O formando escolhe esta proposta, ou troca a que já tinha escolhido. */
export function votarNaProposta(id: string) {
  return api.put<void>(`${PROPOSTAS}/${id}/voto`)
}

/** Tira o voto do formando naquele item. */
export function desvotarNoItem(itemId: string) {
  return api.delete<void>(`${ITENS}/${itemId}/voto`)
}
