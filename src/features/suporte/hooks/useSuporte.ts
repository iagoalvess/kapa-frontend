import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ativarAssinatura,
  buscarNoSuporte,
  executarNaConta,
  obterContaNoSuporte,
  obterTurmaNoSuporte,
} from '../api/suporte.api'
import type { AcaoNaConta } from '../types/suporte.types'

export const chaves = {
  busca: (termo: string) => ['suporte', 'busca', termo] as const,
  turma: (id: string) => ['suporte', 'turma', id] as const,
  conta: (id: string) => ['suporte', 'conta', id] as const,
}

/** Piso do termo: é o mesmo do backend, e evita a ida ao servidor que voltaria vazia. */
const MINIMO_DO_TERMO = 3

/**
 * A busca do painel: turma e conta na mesma caixa.
 *
 * `enabled` pelo tamanho do termo, e não `keepPreviousData`: a lista some enquanto a pessoa digita
 * um termo novo, o que é o comportamento certo — resultado do termo anterior ao lado de uma caixa
 * com outro texto é o tipo de coisa que faz o atendente abrir a turma errada.
 */
export function useBuscaNoSuporte(termo: string) {
  return useQuery({
    queryKey: chaves.busca(termo),
    queryFn: ({ signal }) => buscarNoSuporte(termo, signal),
    enabled: termo.trim().length >= MINIMO_DO_TERMO,
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
