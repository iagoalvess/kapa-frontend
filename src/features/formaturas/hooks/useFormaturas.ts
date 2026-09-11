import { useMutation, useQuery } from '@tanstack/react-query'
import { sessao } from '@/lib/http/sessao'
import { queryClient } from '@/lib/query/client'
import { listarMinhasFormaturas, selecionarFormatura } from '../api/formaturas.api'
import { chaves } from './chaves'

/** Formaturas em que o usuário tem vínculo ativo. Funciona sem formatura selecionada. */
export function useMinhasFormaturas() {
  return useQuery({
    queryKey: chaves.minhas(),
    queryFn: ({ signal }) => listarMinhasFormaturas(signal),
  })
}

/**
 * Troca a formatura da sessão.
 *
 * O `queryClient.clear()` não é higiene: sem ele, a tela seguinte mostra por alguns segundos os
 * dados em cache da turma anterior — exatamente o vazamento que o isolamento existe para
 * impedir, só que do lado do cliente.
 *
 * A listagem de formaturas sobrevive à limpeza: ela é do usuário, não da turma, e o seletor
 * continua na tela precisando dela — sem isso ele some do cabeçalho até a busca voltar.
 */
export function useSelecionarFormatura() {
  return useMutation({
    mutationFn: selecionarFormatura,
    onSuccess: (par) => {
      const minhas = queryClient.getQueryData(chaves.minhas())
      sessao.autenticar(par)
      queryClient.clear()
      queryClient.setQueryData(chaves.minhas(), minhas)
    },
  })
}
