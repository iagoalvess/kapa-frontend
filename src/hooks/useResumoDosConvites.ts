import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/http/cliente'
import type { EventoDoConvite, ResumoDosConvites } from '@/types/festa'

/** As chaves de cache do convite da festa — a portaria e a agenda invalidam o mesmo prefixo. */
export const chavesDosConvites = {
  tudo: ['convites-da-festa'] as const,
  resumo: ['convites-da-festa', 'resumo'] as const,
  meus: (tipo: EventoDoConvite['tipo']) => ['convites-da-festa', 'meus', tipo] as const,
  publico: (token: string) => ['convites-da-festa', 'publico', token] as const,
  portaria: (tipo: EventoDoConvite['tipo'], busca: string) =>
    ['convites-da-festa', 'portaria', tipo, busca] as const,
  consulta: (codigo: string) => ['convites-da-festa', 'consulta', codigo] as const,
}

/**
 * A situação dos convites da festa: emitidos, sem titular, pedidos esperando e parcelas tarde demais.
 *
 * Em `hooks/` porque a portaria e a agenda o leem — e uma feature não importa de outra.
 *
 * @param habilitado Falso não consulta: o formando não tem acesso, e a agenda só pergunta pela Gestão.
 */
export function useResumoDosConvites(habilitado = true) {
  return useQuery({
    queryKey: chavesDosConvites.resumo,
    queryFn: ({ signal }) => api.get<ResumoDosConvites>('/api/v1/festa/convites/resumo', { signal }),
    enabled: habilitado,
  })
}
