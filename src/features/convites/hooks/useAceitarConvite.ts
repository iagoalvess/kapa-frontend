import { useMutation, useQuery } from '@tanstack/react-query'
import { sessao } from '@/lib/http/sessao'
import { queryClient } from '@/lib/query/client'
import { aceitarConvite, obterConvite, reenviarConfirmacao } from '../api/convites.api'
import { chaves } from './chaves'

/** Turma, instituição e papel do convite — o que o convidado vê antes de entrar. */
export function useConvitePublico(token: string) {
  return useQuery({
    queryKey: chaves.publico(token),
    queryFn: ({ signal }) => obterConvite(token, signal),
  })
}

/**
 * Aceite do convite.
 *
 * A resposta é a sessão já dentro da turma nova. Mesma regra da troca de formatura: grava o par e
 * limpa o cache — quem estava em outra turma não pode ver, nem por um instante, os dados dela na
 * tela da nova.
 */
export function useAceitarConvite() {
  return useMutation({
    mutationFn: aceitarConvite,
    onSuccess: (par) => {
      sessao.autenticar(par)
      queryClient.clear()
    },
  })
}

/** Reenvio do e-mail de confirmação, para quem precisa confirmar antes de aceitar o convite pessoal. */
export function useReenviarConfirmacao() {
  return useMutation({ mutationFn: reenviarConfirmacao })
}
