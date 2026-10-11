import { useQuery } from '@tanstack/react-query'
import { MODULOS } from '@/config/planos'
import { api } from '@/lib/http/cliente'
import type { EnqueteDetalhe, EnqueteResumo } from '@/types/enquete'
import { usePlanoDaTurma } from './usePlanoDaTurma'
import { useFormaturaAtiva } from './useSessao'

/** Chaves compartilhadas pela lista, detalhe, home. */
export const chavesDasEnquetes = { tudo: ['enquetes'] as const }

/** A lista compartilhada atualiza pendências e encerra enquetes pelo relógio do servidor. */
export function useEnquetes() {
  const { formaturaId, desligadoEm } = useFormaturaAtiva()
  const inclui = usePlanoDaTurma().inclui(MODULOS.enquetes)
  return useQuery({
    queryKey: [...chavesDasEnquetes.tudo, formaturaId, 'lista'],
    queryFn: ({ signal }) => api.get<EnqueteResumo[]>('/api/v1/enquetes', { signal }),
    enabled: !!formaturaId && !desligadoEm && inclui,
    refetchInterval: 15_000,
  })
}

/** Detalhe com resultado ao vivo; a mesma invalidação atualiza toda a participação. */
export function useEnquete(id: string | undefined) {
  const { formaturaId } = useFormaturaAtiva()
  const inclui = usePlanoDaTurma().inclui(MODULOS.enquetes)
  return useQuery({
    queryKey: [...chavesDasEnquetes.tudo, formaturaId, id],
    queryFn: ({ signal }) => api.get<EnqueteDetalhe>(`/api/v1/enquetes/${id}`, { signal }),
    enabled: !!id && !!formaturaId && inclui,
    refetchInterval: (consulta) => (consulta.state.data?.enquete.situacao === 'Aberta' ? 15_000 : false),
  })
}

/** Pendência é uma consulta aberta que a pessoa pode responder e ainda não respondeu. */
export function enquetesPendentes(enquetes: readonly EnqueteResumo[] | undefined) {
  return (
    enquetes?.filter(
      (enquete) => enquete.situacao === 'Aberta' && enquete.pode_responder && enquete.minha_resposta === null,
    ) ?? []
  )
}

/** Uma consulta na home: aberta mais recente, ou a última que efetivamente encerrou. */
export function enqueteDaHome(enquetes: readonly EnqueteResumo[] | undefined) {
  const abertas = enquetes
    ?.filter((e) => e.situacao === 'Aberta')
    .toSorted((a, b) => b.criado_em.localeCompare(a.criado_em))
  return (
    abertas?.[0] ??
    enquetes
      ?.filter((e) => e.situacao === 'Encerrada')
      .toSorted((a, b) => (b.encerrada_em ?? b.encerra_em).localeCompare(a.encerrada_em ?? a.encerra_em))[0]
  )
}
