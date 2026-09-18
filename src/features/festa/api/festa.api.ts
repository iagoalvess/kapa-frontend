import { api } from '@/lib/http/cliente'
import type { DadosDoItemDaFesta, ItemDaFesta } from '@/types/festa'

const ITENS = '/api/v1/festa/itens'

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
