import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { CHAVE_DA_FORMATURA_ATUAL } from '@/hooks/useFormaturaAtual'
import { useFormaturaAtiva } from '@/hooks/useSessao'
import {
  cancelarAssinatura,
  listarCobrancasDoPlano,
  obterAssinatura,
  trocarMeio,
  trocarPlano,
} from '../api/assinaturas.api'
import type { Assinatura, Troca } from '../types/assinaturas.types'
import { chaves } from './chaves'
import { irParaOProvedor } from './useCheckout'

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

/** De quanto em quanto tempo a volta do checkout pergunta se o pagamento confirmou. */
const INTERVALO_DO_RETORNO = 3_000

/**
 * A assinatura na volta do checkout, consultada a cada 3 s enquanto está pendente.
 *
 * Confirmada, recarrega a formatura: a faixa de status do layout lê a formatura, que o webhook acabou
 * de ativar — sem isto ela continuaria dizendo "conclua a contratação" ao lado do "pagamento
 * confirmado".
 */
export function useAssinaturaDoRetorno() {
  const cliente = useQueryClient()
  const assinatura = useAssinatura({
    refetchInterval: (consulta) =>
      consulta.state.data?.status === 'Pendente' ? INTERVALO_DO_RETORNO : false,
  })
  const confirmada = assinatura.data?.status === 'Ativa'

  useEffect(() => {
    if (confirmada) void cliente.invalidateQueries({ queryKey: CHAVE_DA_FORMATURA_ATUAL })
  }, [confirmada, cliente])

  return assinatura
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
    onSuccess: () => {
      void invalidar()
    },
  })
}

/** O histórico de pagamentos do plano da turma selecionada. */
export function useCobrancasDoPlano() {
  const { formaturaId } = useFormaturaAtiva()

  return useQuery({
    queryKey: chaves.cobrancas(formaturaId),
    queryFn: ({ signal }) => listarCobrancasDoPlano(signal),
    enabled: formaturaId !== null,
  })
}

/**
 * Uma troca que pode ou não passar pelo Mercado Pago: com página (a diferença a pagar, o cartão a autorizar), o
 * navegador vai para ela; sem, a assinatura é recarregada ali mesmo.
 */
function useTroca<T>(trocar: (valor: T) => Promise<Troca>) {
  const invalidar = useInvalidarAssinatura()

  return useMutation({
    mutationFn: trocar,
    onSuccess: ({ url }) => {
      if (url) irParaOProvedor(url)
      else void invalidar()
    },
  })
}

/** Troca de plano no mesmo ciclo (P4): a subida vai pagar a diferença; a descida fica agendada. */
export function useTrocarPlano() {
  return useTroca(trocarPlano)
}

/** Troca de meio (P5): o cartão vai à autorização; o PIX vale na hora. */
export function useTrocarMeio() {
  return useTroca(trocarMeio)
}
