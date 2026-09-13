import { useQuery } from '@tanstack/react-query'
import { listarFormandos, obterFormando } from '../api/formandos.api'
import type { FiltroDeFormandos } from '../types/formandos.types'
import { chaves } from './chaves'

/** Uma página dos formandos, com a completude de cada cadastro. */
export function useFormandos(filtro: FiltroDeFormandos) {
  return useQuery({
    queryKey: chaves.lista(filtro),
    queryFn: ({ signal }) => listarFormandos(filtro, signal),
    // Mantém a página anterior na tela enquanto a próxima chega, em vez de piscar "Carregando".
    placeholderData: (anterior) => anterior,
  })
}

/**
 * Quantos ainda não preencheram o essencial — o número do aviso.
 *
 * Uma página de um item só: a pergunta é o `total`, e a lista já vem da outra consulta.
 */
export function usePendentes() {
  return useQuery({
    queryKey: chaves.lista({ situacao: 'Pendente', tamanho: 1 }),
    queryFn: ({ signal }) => listarFormandos({ situacao: 'Pendente', tamanho: 1 }, signal),
    select: (pagina) => pagina.total,
  })
}

/** O cadastro de um formando da turma. */
export function useFormando(usuarioId: string) {
  return useQuery({
    queryKey: chaves.detalhe(usuarioId),
    queryFn: ({ signal }) => obterFormando(usuarioId, signal),
  })
}
