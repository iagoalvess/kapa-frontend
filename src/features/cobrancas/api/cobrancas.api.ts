import { api } from '@/lib/http/cliente'
import { type Pagina, paginacaoNaQuery } from '@/types/paginacao'
import type {
  DadosDoItem,
  DadosDoPlano,
  FiltroDeParcelas,
  Parcela,
  PlanoDeCobranca,
  PlanoDeCobrancaResumo,
  ResumoDeParcelas,
  SimulacaoDoPlano,
} from '../types/cobrancas.types'

const BASE = '/api/v1/cobrancas'
const PLANOS = `${BASE}/planos`

/** Os planos da turma, o vigente primeiro. */
export function listarPlanos(signal?: AbortSignal) {
  return api.get<PlanoDeCobrancaResumo[]>(PLANOS, { signal })
}

/** Um plano, com os itens. */
export function obterPlano(planoId: string, signal?: AbortSignal) {
  return api.get<PlanoDeCobranca>(`${PLANOS}/${planoId}`, { signal })
}

/** Cria um plano em montagem, sem itens. */
export function criarPlano(dados: DadosDoPlano) {
  return api.post<PlanoDeCobranca>(PLANOS, { body: dados })
}

/** Altera nome e regras de atraso. */
export function atualizarPlano({ planoId, dados }: { planoId: string; dados: DadosDoPlano }) {
  return api.put<PlanoDeCobranca>(`${PLANOS}/${planoId}`, { body: dados })
}

/** Inclui um item; devolve o plano inteiro. */
export function adicionarItem({ planoId, dados }: { planoId: string; dados: DadosDoItem }) {
  return api.post<PlanoDeCobranca>(`${PLANOS}/${planoId}/itens`, { body: dados })
}

/** Altera um item; devolve o plano inteiro. */
export function alterarItem({
  planoId,
  itemId,
  dados,
}: {
  planoId: string
  itemId: string
  dados: DadosDoItem
}) {
  return api.put<PlanoDeCobranca>(`${PLANOS}/${planoId}/itens/${itemId}`, { body: dados })
}

/** Remove um item que nunca gerou parcela. */
export function removerItem({ planoId, itemId }: { planoId: string; itemId: string }) {
  return api.delete<PlanoDeCobranca>(`${PLANOS}/${planoId}/itens/${itemId}`)
}

/** Encerra um item: para de cobrar e cancela o que ainda não venceu. */
export function encerrarItem({ planoId, itemId }: { planoId: string; itemId: string }) {
  return api.post<PlanoDeCobranca>(`${PLANOS}/${planoId}/itens/${itemId}/encerrar`)
}

/**
 * A grade de um formando e o total da turma, sem gravar nada.
 *
 * @param itens Os do formulário; ausente, a API simula os gravados.
 */
export function simularPlano(planoId: string, itens: DadosDoItem[] | undefined, signal?: AbortSignal) {
  return api.post<SimulacaoDoPlano>(`${PLANOS}/${planoId}/simular`, { body: { itens }, signal })
}

/** Coloca o plano em vigor. Só o Presidente. */
export function vigorarPlano(planoId: string) {
  return api.post<PlanoDeCobranca>(`${PLANOS}/${planoId}/vigorar`)
}

/** Uma página das parcelas da turma. */
export function listarParcelas(filtro: FiltroDeParcelas, signal?: AbortSignal) {
  return api.get<Pagina<Parcela>>(`${BASE}/parcelas`, {
    query: {
      ...paginacaoNaQuery(filtro),
      usuario_id: filtro.usuario_id,
      status: filtro.status,
      de: filtro.de,
      ate: filtro.ate,
      busca: filtro.busca,
    },
    signal,
  })
}

/** Quantas parcelas e quanto somam por situação, nos mesmos filtros da lista (menos a situação). */
export function resumirParcelas(
  filtro: Omit<FiltroDeParcelas, 'status' | 'pagina' | 'tamanho'>,
  signal?: AbortSignal,
) {
  return api.get<ResumoDeParcelas>(`${BASE}/parcelas/resumo`, {
    query: { usuario_id: filtro.usuario_id, de: filtro.de, ate: filtro.ate, busca: filtro.busca },
    signal,
  })
}
