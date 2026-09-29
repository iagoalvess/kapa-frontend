import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CartaoTokenizado } from '@/types/pagamento'
import { ehErroDaApi } from '@/lib/http/erros'
import { instanteDe } from '@/lib/formato'
import {
  apagarDados,
  buscarCompra,
  buscarLoja,
  comprar,
  gerarCobranca,
  pagarCompraNoCartao,
  nomearConvidadoDaCompra,
  reenviarLink,
} from '../api/loja.api'
import type { Compra } from '../types/loja.types'
import { chaves } from './chaves'

/** De quanto em quanto tempo a vitrine relê o contador de restantes — a resposta vale 2 s na borda. */
export const INTERVALO_DA_VITRINE = 5_000

/** De quanto em quanto tempo a compra pendente relê a situação, esperando o pagamento cair. */
export const INTERVALO_DA_COMPRA = 5_000

/** Quantas vezes a compra volta à fila cheia antes de desistir e mostrar o erro. */
const TENTATIVAS_NA_FILA = 5

/**
 * A vitrine da loja, com a diferença entre o relógio do servidor e o do aparelho.
 *
 * A diferença é medida na chegada da resposta: a contagem regressiva soma ela ao `Date.now()` e nunca
 * confia no relógio do celular, que pode estar adiantado (decisão 8). Relê a cada poucos segundos para
 * o contador de restantes andar; 429 e 404 não se repetem — a leitura seguinte já vem no intervalo.
 */
export function useLoja(formaturaId: string) {
  return useQuery({
    queryKey: chaves.loja(formaturaId),
    queryFn: async ({ signal }) => {
      const loja = await buscarLoja(formaturaId, signal)

      return { ...loja, diferencaDoRelogio: instanteDe(loja.agora) - Date.now() }
    },
    staleTime: 0,
    refetchInterval: INTERVALO_DA_VITRINE,
    retry: false,
  })
}

/**
 * A compra, com nova tentativa sozinha quando a fila da turma está cheia (429).
 *
 * É a exceção à regra "mutação não se repete": a compra é idempotente pela chave que a tela sorteou ao
 * abrir o formulário (decisão 7), e o React Query repete com as **mesmas** variáveis — a mesma chave.
 * A espera é a do `Retry-After`, para a fila andar em vez de ser martelada.
 */
export function useComprar() {
  return useMutation({
    mutationFn: comprar,
    retry: (tentativa, erro) => ehErroDaApi(erro) && erro.status === 429 && tentativa < TENTATIVAS_NA_FILA,
    retryDelay: (_tentativa, erro) => (ehErroDaApi(erro) && erro.repetirEm ? erro.repetirEm : 1) * 1000,
  })
}

/** Pede o link de novo para o e-mail da compra. A resposta é a mesma exista compra ou não. */
export function useReenviarLink() {
  return useMutation({ mutationFn: reenviarLink })
}

/**
 * A compra pelo link. Enquanto espera o pagamento, relê a cada poucos segundos: o aviso do Mercado
 * Pago confirma sozinho, e a tela vira "paga" sem ninguém recarregar.
 */
export function useCompra(token: string) {
  return useQuery({
    queryKey: chaves.compra(token),
    queryFn: ({ signal }) => buscarCompra(token, signal),
    staleTime: 0,
    retry: false,
    refetchInterval: (consulta) => (consulta.state.data?.status === 'Pendente' ? INTERVALO_DA_COMPRA : false),
  })
}

/** Grava a compra que voltou de uma escrita — é a mesma forma da leitura. */
function useGravarCompra(token: string) {
  const queryClient = useQueryClient()

  return (compra: Compra) => queryClient.setQueryData(chaves.compra(token), compra)
}

/** Gera o documento da compra que ficou sem ele. */
export function useGerarCobranca(token: string) {
  const gravar = useGravarCompra(token)

  return useMutation({ mutationFn: () => gerarCobranca(token), onSuccess: gravar })
}

/** Paga a compra no cartão (Sprint 39); a compra que volta — paga, com os convites — vai direto para a tela. */
export function usePagarCompraNoCartao(token: string) {
  const gravar = useGravarCompra(token)

  return useMutation({
    mutationFn: (dados: { cartao: CartaoTokenizado; valorEmCentavos: number }) =>
      pagarCompraNoCartao({ token, ...dados }),
    onSuccess: gravar,
  })
}

/** Nomeia ou transfere um convite da compra; a lista relê, porque a troca de titular troca o código. */
export function useNomearConvidadoDaCompra(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: nomearConvidadoDaCompra,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: chaves.compra(token) }),
  })
}

/**
 * Apaga os dados do comprador. O link morre junto: a tela tira os dados do que já tem em mãos, em vez
 * de reler — a releitura daria 404 e trocaria o aviso de sucesso por "compra não encontrada".
 */
export function useApagarDados(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apagarDados(token),
    onSuccess: () =>
      queryClient.setQueryData<Compra>(chaves.compra(token), (compra) =>
        compra ? { ...compra, nome_do_comprador: null, email: null, pode_apagar_dados: false } : compra,
      ),
  })
}
