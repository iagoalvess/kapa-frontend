import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  atualizarAviso,
  excluirAviso,
  listarAvisos,
  obterAviso,
  publicarAviso,
  resumirMural,
} from '../api/comunicacao.api'
import type { FiltroDeAvisos } from '../types/comunicacao.types'
import { chaves } from './chaves'

/** Uma página do mural. A anterior fica na tela enquanto a próxima chega. */
export function useAvisos(filtro: FiltroDeAvisos) {
  return useQuery({
    queryKey: chaves.avisos(filtro),
    queryFn: ({ signal }) => listarAvisos(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}

/** Os números do mural: os indicadores do topo e a contagem de cada pílula. */
export function useResumoDoMural() {
  return useQuery({
    queryKey: chaves.resumoDoMural,
    queryFn: ({ signal }) => resumirMural(signal),
  })
}

/** Um aviso, para a leitura inteira. */
export function useAviso(id: string) {
  return useQuery({
    queryKey: chaves.aviso(id),
    queryFn: ({ signal }) => obterAviso(id, signal),
    enabled: !!id,
  })
}

/**
 * Toda escrita do mural derruba a lista e o detalhe.
 *
 * `void` na invalidação: devolver a promessa faria o React Query esperar o recarregamento antes do
 * `onSuccess` de quem chamou — e, se ele desmontar a tela (excluir volta ao mural), o toast some.
 */
function useEscritaDoMural<T, R>(escrever: (variaveis: T) => Promise<R>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.todosOsAvisos })
    },
  })
}

export const usePublicarAviso = () => useEscritaDoMural(publicarAviso)
export const useAtualizarAviso = () => useEscritaDoMural(atualizarAviso)
export const useExcluirAviso = () => useEscritaDoMural(excluirAviso)
