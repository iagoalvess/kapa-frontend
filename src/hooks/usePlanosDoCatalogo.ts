import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/http/cliente'
import type { Plano } from '@/types/plano'

/**
 * Os planos do catálogo da plataforma. Endpoint anônimo — é vitrine.
 *
 * Mora em `hooks/`, e não em `features/assinaturas`, porque duas telas o consomem: a vitrine dentro
 * do app e a tabela de preços da página institucional — e uma feature não importa de outra. Cada
 * uma tinha a sua cópia da chamada e a sua chave de cache até 17/09/2026, o que fazia a mesma
 * tabela de preços ser baixada duas vezes por quem passava pelas duas. A chamada fica aqui junto do
 * hook, como em {@link useDocumentosVigentes}: é a única dele.
 *
 * Uma hora fresco: o catálogo muda algumas vezes por ano, e a landing é a tela mais visitada e a
 * menos autenticada do produto — reconsultar a cada visita não compra nada.
 */
export function usePlanosDoCatalogo() {
  return useQuery({
    queryKey: ['planos'],
    queryFn: ({ signal }) => api.get<Plano[]>('/api/v1/planos', { autenticar: false, signal }),
    staleTime: 60 * 60_000,
  })
}
