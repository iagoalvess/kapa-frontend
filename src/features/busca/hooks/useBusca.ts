import { useQuery } from '@tanstack/react-query'
import { buscar } from '../api/busca.api'
import { TAMANHO_MINIMO } from '../types/busca.types'

export const chaves = {
  tudo: ['busca'] as const,
  termo: (termo: string) => ['busca', termo] as const,
}

/**
 * O que a turma tem com aquele termo.
 *
 * Só consulta com o termo no tamanho mínimo — o mesmo piso do backend, para não gastar uma ida ao
 * servidor que já se sabe que volta vazia. Meio minuto fresco: dentro de uma sessão de busca a
 * pessoa apaga e redigita o mesmo termo o tempo todo, e o resultado não muda nesse intervalo.
 *
 * @param termo Já com o atraso da digitação aplicado por quem chama.
 */
export function useBusca(termo: string) {
  return useQuery({
    queryKey: chaves.termo(termo),
    queryFn: ({ signal }) => buscar(termo, signal),
    enabled: termo.length >= TAMANHO_MINIMO,
    staleTime: 30_000,
  })
}
