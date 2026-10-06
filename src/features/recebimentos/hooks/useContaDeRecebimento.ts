import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  conferirConta,
  confirmarTroca,
  gravarConta,
  obterConta,
  obterPixDeTeste,
} from '../api/recebimentos.api'
import type { ContaDeRecebimento } from '../types/recebimentos.types'
import { chaves } from './chaves'

/** A conta da turma. `data.conta` ausente: a chave ainda não foi cadastrada. */
export function useContaDeRecebimento() {
  return useQuery({ queryKey: chaves.conta(), queryFn: ({ signal }) => obterConta(signal) })
}

/**
 * O PIX de teste da chave gravada.
 *
 * @param habilitado Só o Presidente lê, e só enquanto a conta não foi conferida.
 */
export function usePixDeTeste(habilitado: boolean) {
  return useQuery({
    queryKey: chaves.pixDeTeste(),
    queryFn: ({ signal }) => obterPixDeTeste(signal),
    enabled: habilitado,
  })
}

/**
 * Toda escrita devolve a conta inteira: ela vai direto para o cache, e o PIX de teste — que sai da
 * chave — recarrega. A invalidação vai com `void`: devolvida, atrasaria o `onSuccess` de quem chamou.
 */
function useEscritaDaConta<T>(escrever: (variaveis: T) => Promise<ContaDeRecebimento>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: (conta) => {
      queryClient.setQueryData(chaves.conta(), { conta })
      void queryClient.invalidateQueries({ queryKey: chaves.pixDeTeste() })
    },
  })
}

export const useConferirConta = () => useEscritaDaConta(conferirConta)
export const useConfirmarTroca = () => useEscritaDaConta(confirmarTroca)

/**
 * Grava os meios. A conta só vai para o cache quando a troca já valeu — pedida, ela espera o link do e-mail e
 * a tela continua mostrando a conta de antes.
 */
export function useGravarConta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: gravarConta,
    onSuccess: ({ conta, confirmacao_enviada_para }) => {
      if (confirmacao_enviada_para) return
      queryClient.setQueryData(chaves.conta(), { conta })
      void queryClient.invalidateQueries({ queryKey: chaves.pixDeTeste() })
    },
  })
}
