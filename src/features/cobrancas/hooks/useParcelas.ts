import { useQuery } from '@tanstack/react-query'
import { listarParcelas, resumirParcelas } from '../api/cobrancas.api'
import type { FiltroDeParcelas } from '../types/cobrancas.types'
import { chaves } from './chaves'

/** Uma página das parcelas da turma. A anterior fica na tela enquanto a próxima chega. */
export function useParcelas(filtro: FiltroDeParcelas) {
  return useQuery({
    queryKey: chaves.parcelas(filtro),
    queryFn: ({ signal }) => listarParcelas(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}

/**
 * Quantas parcelas e quanto somam em cada situação — a faixa e as pílulas, numa chamada só.
 *
 * @param filtro Formando, período e busca, como na lista.
 */
export function useResumoDeParcelas(filtro: Omit<FiltroDeParcelas, 'status' | 'pagina' | 'tamanho'>) {
  return useQuery({
    queryKey: chaves.resumo(filtro),
    queryFn: ({ signal }) => resumirParcelas(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}
