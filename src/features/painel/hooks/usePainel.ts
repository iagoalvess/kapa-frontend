import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { faixasDeAnalise } from '@/components/FiltroDePeriodo'
import { baixarArquivo } from '@/lib/download'
import type { PaginacaoRequest } from '@/types/paginacao'
import {
  ativarAssinatura,
  baixarPagamentosDoMes,
  estornarPagamento,
  executarNaConta,
  listarContas,
  listarMembros,
  listarTurmas,
  obterAnalytics,
  obterContaNoSuporte,
  obterSerieMensal,
  obterTurmaNoSuporte,
} from '../api/painel.api'
import type { AcaoNaConta, FiltroDeContas, FiltroDeTurmas, ModoDeEstorno } from '../types/painel.types'
import { chaves } from './chaves'

/** Os meses da série da Visão geral (P3). */
export const MESES_DA_SERIE = 12

/** Contas, turmas, dinheiro e uso no período. O período anterior fica na tela enquanto o novo chega. */
export function useAnalytics(periodo: { de?: string; ate?: string }) {
  return useQuery({
    queryKey: chaves.analytics(periodo),
    queryFn: ({ signal }) => obterAnalytics(periodo, signal),
    placeholderData: (anterior) => anterior,
  })
}

/**
 * O analytics dos últimos 30 dias — o período padrão da Visão geral, na mesma chave de cache. As listas de
 * Turmas e Contas tiram daqui a faixa do topo e a contagem dos chips, sem endpoint próprio de resumo.
 */
export function useAnalyticsDoPadrao() {
  const [de, ate] = faixasDeAnalise()['30 dias']

  return useAnalytics({ de, ate })
}

/** A série de doze meses: não depende do período escolhido, e por isso tem cache próprio. */
export function useSerieMensal() {
  return useQuery({
    queryKey: chaves.serie(MESES_DA_SERIE),
    queryFn: ({ signal }) => obterSerieMensal(MESES_DA_SERIE, signal),
  })
}

/** Uma página das turmas. A anterior fica na tela enquanto a próxima chega. */
export function useTurmasDoPainel(filtro: FiltroDeTurmas) {
  return useQuery({
    queryKey: chaves.turmas(filtro),
    queryFn: ({ signal }) => listarTurmas(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}

/** Uma página das contas. */
export function useContasDoPainel(filtro: FiltroDeContas) {
  return useQuery({
    queryKey: chaves.contas(filtro),
    queryFn: ({ signal }) => listarContas(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}

/** A turma no painel. */
export function useTurmaNoSuporte(id: string) {
  return useQuery({
    queryKey: chaves.turma(id),
    queryFn: ({ signal }) => obterTurmaNoSuporte(id, signal),
    enabled: !!id,
  })
}

/** Uma página dos membros da turma, paginada no servidor (T4). */
export function useMembrosNoSuporte(id: string, paginacao: PaginacaoRequest) {
  return useQuery({
    queryKey: chaves.membros(id, paginacao),
    queryFn: ({ signal }) => listarMembros(id, paginacao, signal),
    enabled: !!id,
    placeholderData: (anterior) => anterior,
  })
}

/** A conta no painel. */
export function useContaNoSuporte(id: string) {
  return useQuery({
    queryKey: chaves.conta(id),
    queryFn: ({ signal }) => obterContaNoSuporte(id, signal),
    enabled: !!id,
  })
}

/**
 * Ativa a licença da turma à mão.
 *
 * A resposta já é a turma atualizada, e ela entra direto no cache: a tela mostra o estado novo sem
 * uma segunda ida ao servidor, e sem a piscada de "ativando… ainda pendente… ativa".
 */
export function useAtivarAssinatura(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => ativarAssinatura(id),
    onSuccess: (turma) => {
      queryClient.setQueryData(chaves.turma(id), turma)
    },
  })
}

/** Estorna um pagamento do plano. A turma devolvida entra direto no cache, como na ativação. */
export function useEstornarPagamento(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cobrancaId, modo }: { cobrancaId: string; modo: ModoDeEstorno }) =>
      estornarPagamento(id, cobrancaId, modo),
    onSuccess: (turma) => {
      queryClient.setQueryData(chaves.turma(id), turma)
    },
  })
}

/** Baixa a planilha do mês para a nota fiscal manual. */
export function useBaixarPagamentosDoMes() {
  return useMutation({
    mutationFn: async ({ ano, mes }: { ano: number; mes: number }) => {
      baixarArquivo(
        await baixarPagamentosDoMes(ano, mes),
        `pagamentos-dos-planos-${ano}-${String(mes).padStart(2, '0')}.xlsx`,
      )
    },
  })
}

/**
 * As três ações de conta: reenviar confirmação, disparar redefinição e desbloquear.
 *
 * Uma mutação para as três porque o pedido é o mesmo — muda só o último segmento da rota —, e
 * quem chama já sabe qual disparou. Três hooks iguais só multiplicariam o `invalidateQueries`.
 *
 * `void` na invalidação de propósito: devolver a promessa faria o `onSuccess` de quem chamou
 * esperar a consulta, e o aviso de sucesso apareceria depois do recarregamento da tela.
 */
export function useAcaoNaConta(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (acao: AcaoNaConta) => executarNaConta(id, acao),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.conta(id) })
    },
  })
}
