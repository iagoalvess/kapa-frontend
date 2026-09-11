import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { sessao } from '@/lib/http/sessao'
import { queryClient } from '@/lib/query/client'
import {
  alterarSenha,
  confirmarEmail,
  reenviarConfirmacao,
  redefinirSenha,
  solicitarRedefinicao,
} from '../api/conta.api'

/**
 * Depois de trocar a senha, a API derruba todas as sessões da conta. O front larga a dele também
 * e manda para o login com um aviso — o access token em memória ainda valeria alguns minutos, e
 * a tela seguiria funcionando até a primeira renovação falhar, sem ninguém entender por quê.
 *
 * Navega **antes** de encerrar, e com `flushSync`: se a tela de login ainda não estiver montada
 * quando a sessão cai, o `ExigeAutenticacao` da tela atual re-renderiza e redireciona por conta
 * própria, com o `state` dele — o aviso se perde e o login devolve a pessoa para a tela de senha.
 */
function useEncerrarSessaoComAviso() {
  const navegar = useNavigate()

  return async (aviso: string) => {
    await navegar(ROTAS.login, { replace: true, state: { aviso }, flushSync: true })
    sessao.encerrar()
    queryClient.clear()
  }
}

/** Pede o link de redefinição de senha. */
export function useSolicitarRedefinicao() {
  return useMutation({ mutationFn: solicitarRedefinicao })
}

/** Redefine a senha pelo link do e-mail e leva para o login. */
export function useRedefinirSenha() {
  const encerrar = useEncerrarSessaoComAviso()

  return useMutation({
    mutationFn: redefinirSenha,
    onSuccess: () => encerrar('Senha redefinida. Entre com a nova senha.'),
  })
}

/** Troca a senha de quem está logado e leva para o login. */
export function useAlterarSenha() {
  const encerrar = useEncerrarSessaoComAviso()

  return useMutation({
    mutationFn: alterarSenha,
    onSuccess: () => encerrar('Senha alterada. Por segurança, entre de novo em todos os aparelhos.'),
  })
}

/** Confirma o e-mail pelo link. */
export function useConfirmarEmail() {
  return useMutation({ mutationFn: confirmarEmail })
}

/** Reenvia o e-mail de confirmação. */
export function useReenviarConfirmacao() {
  return useMutation({ mutationFn: reenviarConfirmacao })
}
