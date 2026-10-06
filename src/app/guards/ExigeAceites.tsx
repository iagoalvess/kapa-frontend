import { Navigate, Outlet, useLocation } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { useMeusAceites } from '@/features/legal'

/**
 * Leva ao re-aceite quem tem documento legal com versão nova ainda não aceita.
 *
 * Navegação, não bloqueio: a API continua respondendo a quem não aceitou a versão nova (decisão
 * da Sprint 1). Por isso a tela **não espera** a pendência: o destino monta e já pede os dados dele
 * enquanto os aceites carregam, e só se vier pendência a pessoa é levada ao re-aceite. Antes a guarda
 * segurava a tela em branco, e a abertura do app virava uma fila — sessão, aceites, e só então a página.
 *
 * Se a consulta falhar, deixa passar — travar o produto porque a pendência não carregou seria pior que
 * pedir o aceite no próximo acesso. Trocar de formatura limpa o cache e a pendência volta a carregar;
 * como a tela não desmonta nesse meio-tempo, o que ela faria ao terminar (a seleção de formatura
 * levando ao destino) continua acontecendo.
 *
 * O destino vai no `state`, pelo mesmo mecanismo do login, para o re-aceite devolver o usuário
 * ao lugar certo.
 */
export function ExigeAceites() {
  const aceites = useMeusAceites()
  const local = useLocation()

  if (aceites.data && aceites.data.pendencias.length > 0) {
    return <Navigate to={ROTAS.aceitePendente} state={{ de: local.pathname + local.search }} replace />
  }

  return <Outlet />
}
