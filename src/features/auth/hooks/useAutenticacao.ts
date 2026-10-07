import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { useEstadoDeNavegacao } from '@/hooks/useEstadoDeNavegacao'
import { convitePendente } from '@/lib/convitePendente'
import { type ParDeTokens, sessao } from '@/lib/http/sessao'
import {
  aceitarConvite,
  confirmarCodigo,
  entrar,
  pediuCodigo,
  reenviarCodigo,
  registrar,
  sair,
} from '../api/auth.api'

/**
 * Guarda a sessão e, para quem chegou por um convite, já entra na turma — ainda nesta tela, com o
 * botão em "carregando". Sem isto a pessoa passava pela página do convite só para ler "Entrando na
 * turma…" antes de ver o app.
 *
 * Se o aceite falha, o convite continua guardado: a guarda leva à página do convite, que tenta de
 * novo e explica o erro (e-mail a confirmar, convite esgotado, já participa).
 */
async function iniciarSessao(par: ParDeTokens, queryClient: QueryClient) {
  const convite = convitePendente.ler()
  let sessaoFinal = par

  if (convite) {
    try {
      sessaoFinal = await aceitarConvite(convite, par.access_token)
      convitePendente.descartar()
      queryClient.clear()
    } catch {
      // A página do convite mostra o erro.
    }
  }

  // Publicar a sessão antes de o aceite terminar faria SomenteVisitante desmontar o formulário
  // e disparar um segundo aceite na página do convite, concorrendo com este.
  sessao.autenticar(sessaoFinal)
}

/** Guarda a sessão e leva para onde a pessoa tentava ir — o `ExigeAutenticacao` deixa o caminho em `state.de`. */
function useConcluirEntrada() {
  const navegar = useNavigate()
  const destino = useEstadoDeNavegacao('de') ?? ROTAS.inicio
  const queryClient = useQueryClient()

  return async (par: ParDeTokens) => {
    await iniciarSessao(par, queryClient)
    navegar(destino, { replace: true })
  }
}

/**
 * Login. Com a sessão na resposta, entra; administrador e presidente param no segundo passo — a resposta é o
 * pedido do código, e quem chamou mostra a etapa do código.
 */
export function useEntrar() {
  const concluir = useConcluirEntrada()

  return useMutation({
    mutationFn: entrar,
    onSuccess: async (resposta) => {
      if (!pediuCodigo(resposta)) await concluir(resposta)
    },
  })
}

/** O segundo passo do login: o código do e-mail. */
export function useConfirmarCodigo() {
  const concluir = useConcluirEntrada()

  return useMutation({ mutationFn: confirmarCodigo, onSuccess: concluir })
}

/** Manda o código de novo. */
export function useReenviarCodigo() {
  return useMutation({ mutationFn: reenviarCodigo })
}

/** Criação de conta. A API já devolve a sessão, então quem se cadastra entra direto. */
export function useRegistrar() {
  const navegar = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registrar,
    onSuccess: async (par) => {
      await iniciarSessao(par, queryClient)
      navegar(ROTAS.inicio, { replace: true })
    },
  })
}

/**
 * Logout.
 *
 * Revoga no servidor e limpa o cache — sem `queryClient.clear()` o próximo usuário a entrar
 * nesta aba veria, por um instante, os dados do anterior.
 *
 * Encerra como `saiu`: o `ExigeAutenticacao` da tela atual redireciona por conta própria antes desta
 * navegação, e sem a marca guardava a tela em `state.de` — a próxima conta a entrar nesta aba caía nela.
 */
export function useSair() {
  const navegar = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    // A falha é engolida de propósito: o cookie pode já ter expirado, e nesse caso não há o que
    // revogar. Deixar o usuário preso numa tela por causa disso seria pior que sair local.
    mutationFn: () => sair().catch(() => {}),
    onSettled: () => {
      sessao.encerrar(true)
      queryClient.clear()
      navegar(ROTAS.login, { replace: true })
    },
  })
}
