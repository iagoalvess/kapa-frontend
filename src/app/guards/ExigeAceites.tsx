import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { useMeusAceites } from '@/features/legal'

/**
 * Leva ao re-aceite quem tem documento legal com versão nova ainda não aceita.
 *
 * Navegação, não bloqueio: a API continua respondendo a quem não aceitou a versão nova (decisão
 * da Sprint 1). Se a consulta falhar, deixa passar — travar o produto porque a pendência não
 * carregou seria pior que pedir o aceite no próximo acesso.
 *
 * Segura a tela só na **primeira** carga. Trocar de formatura limpa o cache e a pendência volta a
 * carregar; desmontar a tela nesse meio-tempo mataria o que ela faria ao terminar — a seleção de
 * formatura ficava parada em vez de levar ao destino.
 *
 * O destino vai no `state`, pelo mesmo mecanismo do login, para o re-aceite devolver o usuário
 * ao lugar certo.
 */
export function ExigeAceites() {
  const aceites = useMeusAceites()
  const local = useLocation()
  const [liberado, definirLiberado] = useState(false)

  if (!liberado && aceites.data?.pendencias.length === 0) definirLiberado(true)

  if (aceites.isPending && !liberado) return null

  if (aceites.data && aceites.data.pendencias.length > 0) {
    return <Navigate to={ROTAS.aceitePendente} state={{ de: local.pathname + local.search }} replace />
  }

  return <Outlet />
}
