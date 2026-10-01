import { api } from '@/lib/http/cliente'
import type { DadosDaProposta, DadosDoItemDaFesta, ItemDaFesta, Proposta } from '@/types/festa'

const ITENS = '/api/v1/festa/itens'
const PROPOSTAS = '/api/v1/festa/propostas'

/*
  Só as escritas moram aqui. As leituras — a lista dos itens e a meta — ficam em
  `hooks/useItensDaFesta`, porque a feature `financeiro` e a Página Inicial também as consomem, e
  uma feature não importa de outra.
*/

/** Cria um item no fim da lista. O contrato, se vier, nasce no acervo e o item aponta para ele. */
export function criarItemDaFesta({ dados, contrato }: { dados: DadosDoItemDaFesta; contrato?: File }) {
  return api.post<ItemDaFesta>(ITENS, { body: formularioDoContrato(dados, contrato) })
}

/** Corrige um item. Item cancelado devolve `festa.item_cancelado`. O contrato, se vier, nasce no acervo. */
export function atualizarItemDaFesta({
  id,
  dados,
  contrato,
}: {
  id: string
  dados: DadosDoItemDaFesta
  contrato?: File
}) {
  return api.put<ItemDaFesta>(`${ITENS}/${id}`, { body: formularioDoContrato(dados, contrato) })
}

/**
 * O item como multipart — o contrato pode vir junto, e vira documento do acervo no servidor.
 *
 * Campos em `snake_case` porque a API os lê assim no formulário; o contrato é opcional, e escolher
 * um documento já existente continua valendo por `documento_id`.
 */
function formularioDoContrato(dados: DadosDoItemDaFesta, contrato?: File) {
  const corpo = new FormData()
  corpo.append('titulo', dados.titulo)
  corpo.append('categoria', dados.categoria)
  corpo.append('rateio', dados.rateio)
  corpo.append('valor_previsto_em_centavos', String(dados.valor_previsto_em_centavos))
  corpo.append('quantidade_estimada', String(dados.quantidade_estimada ?? 1))
  if (dados.o_que_inclui) corpo.append('o_que_inclui', dados.o_que_inclui)
  if (dados.documento_id) corpo.append('documento_id', dados.documento_id)
  if (contrato) corpo.append('contrato', contrato)

  return corpo
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
