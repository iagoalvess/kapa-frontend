import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/http/cliente'
import type { DocumentoLegal } from '@/types/legal'

/**
 * A versão vigente de cada documento legal.
 *
 * Mora em `hooks/`, e não em `features/legal`, porque o cadastro (feature `auth`) precisa das
 * versões para enviar o aceite — e uma feature não importa de outra. A chamada fica aqui junto
 * do hook pelo mesmo motivo: é a única dele.
 *
 * `staleTime` infinito: versão nova é rara, e quando o cadastro esbarra nela o 409 chama
 * `refetch()`.
 */
export function useDocumentosVigentes() {
  return useQuery({
    queryKey: ['legal', 'vigentes'],
    queryFn: ({ signal }) =>
      api.get<DocumentoLegal[]>('/api/v1/legal/vigentes', { autenticar: false, signal }),
    staleTime: Infinity,
  })
}
