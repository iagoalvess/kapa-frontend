import { useMutation } from '@tanstack/react-query'
import { sessao } from '@/lib/http/sessao'
import { queryClient } from '@/lib/query/client'
import { criarFormatura } from '../api/formaturas.api'

/**
 * Cria a formatura e entra nela.
 *
 * A resposta já é a sessão dentro da turma nova. Mesma regra da troca de formatura: grava o par
 * e limpa o cache — o que estava na memória era de antes de a turma existir.
 */
export function useCriarFormatura() {
  return useMutation({
    mutationFn: criarFormatura,
    onSuccess: (par) => {
      sessao.autenticar(par)
      queryClient.clear()
    },
  })
}
