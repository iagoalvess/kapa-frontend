import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MODULOS } from '@/config/planos'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'
import {
  atualizarMesa,
  buscarMapaDeMesas,
  buscarSalaoDoFormando,
  criarMesa,
  definirDonoDaMesa,
  excluirMesa,
  salvarSalao,
} from '../api/mesas.api'

const chavesDasMesas = {
  tudo: ['mesas'] as const,
  mapa: ['mesas', 'mapa'] as const,
  salao: ['mesas', 'salao'] as const,
}

/** O mapa de mesas da Gestão: faixa, mesas e compradores numa resposta. */
export function useMapaDeMesas() {
  return useQuery({ queryKey: chavesDasMesas.mapa, queryFn: ({ signal }) => buscarMapaDeMesas(signal) })
}

/** O mapa do salão para o formando, com as mesas dele marcadas. */
export function useSalaoDoFormando() {
  const { inclui } = usePlanoDaTurma()

  // As mesas são módulo próprio (Sprint 45): a tela da festa pode estar no plano sem elas.
  return useQuery({
    queryKey: chavesDasMesas.salao,
    queryFn: ({ signal }) => buscarSalaoDoFormando(signal),
    enabled: inclui(MODULOS.mesas),
  })
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

/**
 * Salva o mapa e só termina quando o mapa novo chegou.
 *
 * Aqui a espera é de propósito (ao contrário do resto, que não devolve a invalidação): o editor
 * descarta o rascunho no `onSuccess`, e se o mapa antigo ainda estivesse no cache as mesas voltariam
 * ao lugar de antes por um instante. O editor não remonta, então o aviso de sucesso não se perde.
 */
export function useSalvarSalao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: salvarSalao,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chavesDasMesas.tudo }),
  })
}
