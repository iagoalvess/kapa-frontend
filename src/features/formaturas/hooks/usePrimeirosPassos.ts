import { useQuery } from '@tanstack/react-query'
import { obterPrimeirosPassos } from '../api/formaturas.api'
import { chaves } from './chaves'

/**
 * Os passos da comissão até a turma estar rodando — um booleano por passo, calculado pela API.
 *
 * `staleTime: 0`: cada passo se cumpre em outra tela (cobranças, termo, recebimentos, convites), e
 * nenhuma delas sabe desta chave. Voltar ao Início relê — é uma consulta só, e barata.
 *
 * @param habilitado Só quem vê o bloco consulta: a Tesouraria, com a turma ativa.
 */
export function usePrimeirosPassos(habilitado: boolean) {
  return useQuery({
    queryKey: chaves.primeirosPassos(),
    queryFn: ({ signal }) => obterPrimeirosPassos(signal),
    staleTime: 0,
    enabled: habilitado,
  })
}
