import { api } from '@/lib/http/cliente'
import type { BuscaNaTurma } from '../types/busca.types'

/** O que casa com o termo, agrupado e já recortado pelo que o papel pode ver. */
export function buscar(termo: string, signal?: AbortSignal) {
  return api.get<BuscaNaTurma>('/api/v1/busca', { query: { termo }, signal })
}
