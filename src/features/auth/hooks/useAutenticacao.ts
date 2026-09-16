import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { useEstadoDeNavegacao } from '@/hooks/useEstadoDeNavegacao'
import { convitePendente } from '@/lib/convitePendente'
import { type ParDeTokens, sessao } from '@/lib/http/sessao'
import { queryClient } from '@/lib/query/client'
import { aceitarConvite, entrar, registrar, sair } from '../api/auth.api'

/**
 * Guarda a sessão e, para quem chegou por um convite, já entra na turma — ainda nesta tela, com o
 * botão em "carregando". Sem isto a pessoa passava pela página do convite só para ler "Entrando na
 * turma…" antes de ver o app.
 *
 * Se o aceite falha, o convite continua guardado: a guarda leva à página do convite, que tenta de
 * novo e explica o erro (e-mail a confirmar, convite esgotado, já participa).
 */
async function iniciarSessao(par: ParDeTokens) {
  sessao.autenticar(par)

  const convite = convitePendente.ler()
  if (!convite) return

  try {
    sessao.autenticar(await aceitarConvite(convite))
    convitePendente.descartar()
    queryClient.clear()
  } catch {
    // A página do convite mostra o erro.
  }
}

/**
 * Login. Em caso de sucesso guarda a sessão e devolve o usuário para onde ele tentava ir — o
 * `ExigeAutenticacao` deixa o caminho em `state.de` — ou para o início.
 */
export function useEntrar() {
  const navegar = useNavigate()
  const destino = useEstadoDeNavegacao('de') ?? ROTAS.inicio

  return useMutation({
    mutationFn: entrar,
    onSuccess: async (par) => {
      await iniciarSessao(par)
      navegar(destino, { replace: true })
    },
  })
}

/** Criação de conta. A API já devolve a sessão, então quem se cadastra entra direto. */
export function useRegistrar() {
  const navegar = useNavigate()

  return useMutation({
    mutationFn: registrar,
    onSuccess: async (par) => {
      await iniciarSessao(par)
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
