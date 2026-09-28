import { api } from '@/lib/http/cliente'
import type { DadosDaMesa, DesenhoDoSalao, MapaDeMesas, Mesa, SalaoDoFormando } from '../types/mesas.types'

const MESAS = '/api/v1/festa/mesas'

/** O mapa de mesas da Gestão. */
export function buscarMapaDeMesas(signal?: AbortSignal) {
  return api.get<MapaDeMesas>(MESAS, { signal })
}

/** O mapa do salão para o formando: sem os donos, com as mesas dele marcadas. */
export function buscarSalaoDoFormando(signal?: AbortSignal) {
  return api.get<SalaoDoFormando>(`${MESAS}/salao`, { signal })
}

/** Grava o salão e o lugar das mesas que mudaram, de uma vez. */
export function salvarSalao(desenho: DesenhoDoSalao) {
  return api.put<void>(`${MESAS}/salao`, { body: desenho })
}

/** Cadastra uma mesa. Nome repetido devolve `festa.identificacao_em_uso`. */
export function criarMesa(dados: DadosDaMesa) {
  return api.post<Mesa>(MESAS, { body: dados })
}

/** Corrige a mesa. Reservar uma mesa com dono devolve `festa.mesa_reservada`. */
export function atualizarMesa({ id, dados }: { id: string; dados: DadosDaMesa }) {
  return api.put<Mesa>(`${MESAS}/${id}`, { body: dados })
}

/** Exclui a mesa. Com dono, `festa.mesa_com_dono`. */
export function excluirMesa(id: string) {
  return api.delete<void>(`${MESAS}/${id}`)
}

/** Dá a mesa a quem a comprou, ou a solta (`null`). Além do comprado, `festa.mesas_alem_do_pedido`. */
export function definirDonoDaMesa({ id, vinculoId }: { id: string; vinculoId: string | null }) {
  return api.put<Mesa>(`${MESAS}/${id}/dono`, { body: { vinculo_id: vinculoId } })
}
