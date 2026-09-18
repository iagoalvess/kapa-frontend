import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CHAVE_DA_FORMATURA_ATUAL } from '@/hooks/useFormaturaAtual'
import { useFormaturaAtiva } from '@/hooks/useSessao'
import { cancelarAssinatura, obterAssinatura } from '../api/assinaturas.api'
import type { Assinatura } from '../types/assinaturas.types'
import { chaves } from './chaves'

/**
 * A assinatura mais recente da formatura selecionada.
 *
 * @param opcoes `refetchInterval`, para a tela de retorno consultar enquanto o pagamento confirma.
 */
export function useAssinatura(opcoes: Pick<UseQueryOptions<Assinatura>, 'refetchInterval'> = {}) {
  const { formaturaId } = useFormaturaAtiva()

  return useQuery({
    queryKey: chaves.atual(formaturaId),
    queryFn: ({ signal }) => obterAssinatura(signal),
    enabled: formaturaId !== null,
    ...opcoes,
  })
}

/**
 * Recarrega a assinatura e o status da formatura — o pagamento e o cancelamento mexem nos dois, e a
 * faixa de status lê o segundo em toda tela.
 */
export function useInvalidarAssinatura() {
  const cliente = useQueryClient()

  return () =>
    Promise.all([
      cliente.invalidateQueries({ queryKey: chaves.tudo }),
      cliente.invalidateQueries({ queryKey: CHAVE_DA_FORMATURA_ATUAL }),
    ])
}

/** Cancelamento da renovação. */
export function useCancelarAssinatura() {
  const invalidar = useInvalidarAssinatura()

  return useMutation({
    mutationFn: cancelarAssinatura,
    onSuccess: () => invalidar(),
  })
}
