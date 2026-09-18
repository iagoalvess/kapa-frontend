import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  atualizarAviso,
  excluirAviso,
  listarAvisos,
  marcarMuralVisto,
  obterAviso,
  obterNovidades,
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

/**
 * O que há de novo no mural — o selo e a lista do sino.
 *
 * Recarrega sozinho de minuto em minuto e ao voltar para a aba: um aviso publicado agora precisa
 * aparecer para quem está com a tela aberta, e é isso que um sino promete.
 */
export function useNovidadesDoMural() {
  return useQuery({
    queryKey: chaves.novidades,
    queryFn: ({ signal }) => obterNovidades(signal),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
}

/**
 * Marca o mural como visto — quem chama é a tela do mural, ao abrir.
 *
 * `void` na invalidação, como no resto do módulo: a promessa devolvida faria quem chamou esperar o
 * recarregamento do sino por nada.
 */
export function useMarcarMuralVisto() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: marcarMuralVisto,
    onSuccess: () => void cliente.invalidateQueries({ queryKey: chaves.novidades }),
  })
}
