import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chavesDasEnquetes } from '@/hooks/useEnquetes'
import {
  atualizarEnquete,
  cancelarEnquete,
  criarEnquete,
  encerrarEnquete,
  responderEnquete,
  retirarResposta,
} from '../api/enquetes.api'

/** Toda escrita atualiza simultaneamente resultado, lista, home e contador do menu. */
function useEscritaDasEnquetes<T, R>(escrever: (dados: T) => Promise<R>) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: escrever,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: chavesDasEnquetes.tudo })
    },
  })
}

/** Publica uma consulta. */
export const useCriarEnquete = () => useEscritaDasEnquetes(criarEnquete)
/** Edita o cadastro da pergunta. */
export const useAtualizarEnquete = () => useEscritaDasEnquetes(atualizarEnquete)
/** Envia a resposta. */
export const useResponderEnquete = () => useEscritaDasEnquetes(responderEnquete)
/** Retira a resposta. */
export const useRetirarResposta = () => useEscritaDasEnquetes(retirarResposta)
/** Encerra a consulta. */
export const useEncerrarEnquete = () => useEscritaDasEnquetes(encerrarEnquete)
/** Cancela a consulta. */
export const useCancelarEnquete = () => useEscritaDasEnquetes(cancelarEnquete)
