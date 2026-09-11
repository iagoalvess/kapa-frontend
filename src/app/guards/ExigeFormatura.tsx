import { Navigate, Outlet, useLocation } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { useFormaturaAtiva } from '@/hooks/useSessao'

/**
 * Bloqueia o ramo que depende de uma formatura escolhida.
 *
 * Guarda cuida de **navegação**, não de segurança: quem recusa o dado é a API, com a política
 * `FormaturaSelecionada`. O que esta guarda evita é a tela vazia — sem a claim, toda consulta
 * volta sem linha nenhuma e o usuário não teria como saber por quê.
 *
 * O destino pretendido vai no `state` para a seleção devolver o usuário ao lugar certo.
 */
export function ExigeFormatura() {
  const { selecionada } = useFormaturaAtiva()
  const local = useLocation()

  if (!selecionada) {
    return <Navigate to={ROTAS.selecionarFormatura} state={{ de: local.pathname + local.search }} replace />
  }

  return <Outlet />
}
