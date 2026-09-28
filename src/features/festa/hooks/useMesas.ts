import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  atualizarMesa,
  buscarMapaDeMesas,
  buscarMinhasMesas,
  criarMesa,
  definirDonoDaMesa,
  excluirMesa,
} from '../api/mesas.api'

const chavesDasMesas = {
  tudo: ['mesas'] as const,
  mapa: ['mesas', 'mapa'] as const,
  minhas: ['mesas', 'minhas'] as const,
}

/** O mapa de mesas da Gestão: faixa, mesas e compradores numa resposta. */
export function useMapaDeMesas() {
  return useQuery({ queryKey: chavesDasMesas.mapa, queryFn: ({ signal }) => buscarMapaDeMesas(signal) })
}

/** As mesas do próprio formando — vazio quando ele não comprou mesa. */
export function useMinhasMesas() {
  return useQuery({ queryKey: chavesDasMesas.minhas, queryFn: ({ signal }) => buscarMinhasMesas(signal) })
}

/** Toda escrita muda a faixa e a conta dos compradores: derruba o prefixo inteiro. */
function useEscritaDeMesa<T, R>(escrever: (variaveis: T) => Promise<R>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chavesDasMesas.tudo })
    },
  })
}

export const useCriarMesa = () => useEscritaDeMesa(criarMesa)
export const useAtualizarMesa = () => useEscritaDeMesa(atualizarMesa)
export const useExcluirMesa = () => useEscritaDeMesa(excluirMesa)
export const useDefinirDonoDaMesa = () => useEscritaDeMesa(definirDonoDaMesa)
