import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { sessao } from '@/lib/http/sessao'
import { queryClient } from '@/lib/query/client'
import { entrar, sair } from '../api/auth.api'

/** Login. Em caso de sucesso guarda a sessão e leva para o início. */
export function useEntrar() {
  const navegar = useNavigate()

  return useMutation({
    mutationFn: entrar,
    onSuccess: (par) => {
      sessao.autenticar(par)
      navegar(ROTAS.inicio, { replace: true })
    },
  })
}

/**
 * Logout.
 *
 * Revoga no servidor e limpa o cache — sem `queryClient.clear()` o próximo usuário a entrar
 * nesta aba veria, por um instante, os dados do anterior.
 */
export function useSair() {
  const navegar = useNavigate()

  return useMutation({
    // A falha é engolida de propósito: o cookie pode já ter expirado, e nesse caso não há o que
    // revogar. Deixar o usuário preso numa tela por causa disso seria pior que sair local.
    mutationFn: () => sair().catch(() => {}),
    onSettled: () => {
      sessao.encerrar()
      queryClient.clear()
      navegar(ROTAS.login, { replace: true })
    },
  })
}
