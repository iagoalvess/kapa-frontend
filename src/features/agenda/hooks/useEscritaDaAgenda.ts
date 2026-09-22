import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chavesDaAgenda, criarEvento } from '@/hooks/useAgenda'
import { CHAVE_DA_FORMATURA_ATUAL } from '@/hooks/useFormaturaAtual'
import { atualizarEvento, excluirEvento } from '../api/agenda.api'

/**
 * Toda escrita da agenda derruba a lista **e** o detalhe da formatura.
 *
 * O segundo não é zelo: `previsao_de_colacao` e `previsao_da_festa` saem destes eventos desde a
 * Sprint 19, e são elas que desenham o contador do Início, os três marcos e as duas contagens da
 * tela da turma. Invalidar só a agenda deixaria o Início dizendo "faltam 301 dias" depois de a
 * comissão mover a festa.
 *
 * Invalidar sem devolver a promessa é de propósito: devolvê-la adia o `onSuccess` de quem chamou
 * até a lista recarregar, e o toast some junto com a remontagem da tela.
 *
 * @param escrever A chamada de API desta mutação.
 */
function useEscritaDaAgenda<T, R>(escrever: (variaveis: T) => Promise<R>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chavesDaAgenda.tudo })
      void queryClient.invalidateQueries({ queryKey: CHAVE_DA_FORMATURA_ATUAL })
    },
  })
}

/** Marca uma data nova. Segunda colação ou segunda festa devolvem `agenda.tipo_unico`. */
export function useCriarEvento() {
  return useEscritaDaAgenda(criarEvento)
}

/** Corrige uma data, ou cancela o evento pela situação. */
export function useAtualizarEvento() {
  return useEscritaDaAgenda(atualizarEvento)
}

/** Tira o evento da agenda. */
export function useExcluirEvento() {
  return useEscritaDaAgenda(excluirEvento)
}
