import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chavesDosConvites } from '@/hooks/useResumoDosConvites'
import { MODULOS } from '@/config/planos'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'
import type { EventoDoConvite } from '@/types/festa'
import { buscarPainelDeConvites, definirCapacidade, liberarConvitesPresos } from '../api/painelDeConvites.api'

/** O evento do painel: festa ou colação. */
type TipoComConvite = EventoDoConvite['tipo']

const chaveDoPainel = (tipo: TipoComConvite) => [...chavesDosConvites.tudo, 'painel', tipo] as const

/** O painel de convites de um evento — só a Gestão o pede, e só com o módulo `festa` (Sprint 45, P1). */
export function usePainelDeConvites(tipo: TipoComConvite) {
  const { inclui } = usePlanoDaTurma()

  return useQuery({
    queryKey: chaveDoPainel(tipo),
    queryFn: ({ signal }) => buscarPainelDeConvites(tipo, signal),
    enabled: inclui(MODULOS.festa),
  })
}

/** Grava a capacidade; a resposta já é o painel novo, e entra no cache sem esperar a recarga. */
export function useDefinirCapacidade(tipo: TipoComConvite) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (capacidade: number | null) => definirCapacidade(tipo, capacidade),
    onSuccess: (painel) => queryClient.setQueryData(chaveDoPainel(tipo), painel),
  })
}

/** Liberar muda a portaria e os dois painéis (festa e colação): derruba todas as leituras de convite. */
export function useLiberarConvitesPresos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: liberarConvitesPresos,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chavesDosConvites.tudo })
    },
  })
}
