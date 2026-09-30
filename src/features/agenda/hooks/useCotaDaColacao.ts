import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chavesDosConvites } from '@/hooks/useResumoDosConvites'
import { abrirCota, buscarCota, definirCota } from '../api/cota.api'
import { MODULOS } from '@/config/planos'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'

const CHAVE_DA_COTA = [...chavesDosConvites.tudo, 'cota'] as const

/** O painel da cota da colação — só a Gestão o pede. */
export function useCotaDaColacao() {
  const { inclui } = usePlanoDaTurma()

  // A cota emite convites: é do módulo `festa` (Sprint 45, P1).
  return useQuery({
    queryKey: CHAVE_DA_COTA,
    queryFn: ({ signal }) => buscarCota(signal),
    enabled: inclui(MODULOS.festa),
  })
}

/**
 * Toda escrita da cota derruba as leituras de convite: abrir emite convites que a portaria e os
 * "Meus convites" mostram. A resposta já é o painel novo, e entra no cache sem esperar a recarga.
 */
function useEscritaDaCota<T>(escrever: (variaveis: T) => ReturnType<typeof abrirCota>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: (painel) => {
      queryClient.setQueryData(CHAVE_DA_COTA, painel)
      void queryClient.invalidateQueries({ queryKey: chavesDosConvites.tudo })
    },
  })
}

/** Grava a cota e a capacidade. */
export function useDefinirCota() {
  return useEscritaDaCota(definirCota)
}

/** Abre ou reabre a cota. */
export function useAbrirCota() {
  return useEscritaDaCota(abrirCota)
}
