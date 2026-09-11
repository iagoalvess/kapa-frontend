import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { useEstadoDeNavegacao } from '@/hooks/useEstadoDeNavegacao'
import { sessao } from '@/lib/http/sessao'
import { queryClient } from '@/lib/query/client'
import { entrar, registrar, sair } from '../api/auth.api'

/**
 * Login. Em caso de sucesso guarda a sessão e devolve o usuário para onde ele tentava ir — o
 * `ExigeAutenticacao` deixa o caminho em `state.de` — ou para o início.
 */
export function useEntrar() {
  const navegar = useNavigate()
  const destino = useEstadoDeNavegacao('de') ?? ROTAS.inicio

  return useMutation({
    mutationFn: entrar,
    onSuccess: (par) => {
      sessao.autenticar(par)
      navegar(destino, { replace: true })
    },
  })
}

/** Criação de conta. A API já devolve a sessão, então quem se cadastra entra direto. */
export function useRegistrar() {
  const navegar = useNavigate()

  return useMutation({
    mutationFn: registrar,
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
