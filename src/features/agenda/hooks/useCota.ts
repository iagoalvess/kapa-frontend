import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chavesDosConvites } from '@/hooks/useResumoDosConvites'
import { MODULOS } from '@/config/planos'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'
import type { DadosDaCota, EventoDoConvite, PainelDaCota } from '@/types/festa'
import { abrirCota, buscarCota, definirCota } from '../api/cota.api'

/** O evento da cota: festa ou colação. */
type TipoComCota = EventoDoConvite['tipo']

const chaveDaCota = (tipo: TipoComCota) => [...chavesDosConvites.tudo, 'cota', tipo] as const

/** O painel da cota de um evento — só a Gestão o pede. */
export function useCota(tipo: TipoComCota) {
  const { inclui } = usePlanoDaTurma()

  // A cota emite convites: é do módulo `festa` (Sprint 45, P1).
  return useQuery({
    queryKey: chaveDaCota(tipo),
    queryFn: ({ signal }) => buscarCota(tipo, signal),
    enabled: inclui(MODULOS.festa),
  })
}

/**
 * Toda escrita da cota derruba as leituras de convite: abrir emite convites que a portaria e os
 * "Meus convites" mostram. A resposta já é o painel novo, e entra no cache sem esperar a recarga.
 */
function useEscritaDaCota<T>(tipo: TipoComCota, escrever: (dados: T) => Promise<PainelDaCota>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: (painel) => {
      queryClient.setQueryData(chaveDaCota(tipo), painel)
      void queryClient.invalidateQueries({ queryKey: chavesDosConvites.tudo })
    },
  })
}

/** Grava a cota e a capacidade do evento. */
export function useDefinirCota(tipo: TipoComCota) {
  return useEscritaDaCota(tipo, (dados: DadosDaCota) => definirCota(tipo, dados))
}

/** Abre ou reabre a cota do evento. */
export function useAbrirCota(tipo: TipoComCota) {
  return useEscritaDaCota(tipo, () => abrirCota(tipo))
}
