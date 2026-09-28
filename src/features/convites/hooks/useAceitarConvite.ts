import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessao } from '@/lib/http/sessao'
import { aceitarConvite, obterConvite } from '../api/convites.api'
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: aceitarConvite,
    onSuccess: (par) => {
      sessao.autenticar(par)
      queryClient.clear()
    },
  })
}
