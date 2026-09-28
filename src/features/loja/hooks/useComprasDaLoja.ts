import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { baixarArquivo } from '@/lib/download'
import { avisarErro } from '@/lib/http/erros'
import { exportarCompras, listarCompras, resumirLoja } from '../api/loja.api'
import type { FiltroDeCompras } from '../types/loja.types'
import { chaves } from './chaves'

/** As compras da loja, para a Gestão — a lista da devolução (P5). */
export function useComprasDaLoja(filtro: FiltroDeCompras) {
  return useQuery({
    queryKey: chaves.compras(filtro),
    queryFn: ({ signal }) => listarCompras(filtro, signal),
    placeholderData: keepPreviousData,
  })
}

/** O que vendeu, o que está preso esperando e o que falta devolver. */
export function useResumoDaLoja() {
  return useQuery({ queryKey: chaves.resumo, queryFn: ({ signal }) => resumirLoja(signal) })
}

/** Baixa a planilha das compras do filtro, com os contatos. */
export function useExportarCompras() {
  return useMutation({
    mutationFn: async (filtro: Pick<FiltroDeCompras, 'status' | 'busca'>) =>
      baixarArquivo(await exportarCompras(filtro), 'compras-da-loja.xlsx'),
    onError: avisarErro,
  })
}
