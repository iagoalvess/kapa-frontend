import { Navigate, Outlet, useLocation } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { useSessao } from '@/hooks/useSessao'
import { convitePendente } from '@/lib/convitePendente'

/**
 * Bloqueia o ramo autenticado da aplicação.
 *
 * Guarda cuida de **navegação**, não de segurança: quem protege dado é a API. O caminho
 * pretendido vai no `state` para o login devolver o usuário ao lugar certo.
 *
 * Quem abriu um convite sem sessão volta para ele assim que entra — pelo cadastro ou pelo login,
 * que caem no início. A tela do convite descarta o pendente ao abrir com sessão, então o desvio
 * acontece uma vez só.
 */
export function ExigeAutenticacao() {
  const { autenticado } = useSessao()
  const local = useLocation()

  if (!autenticado) {
    return <Navigate to={ROTAS.login} state={{ de: local.pathname + local.search }} replace />
  }

  const convite = convitePendente.ler()
  if (convite) return <Navigate to={`${ROTAS.convite}/${encodeURIComponent(convite)}`} replace />

  return <Outlet />
}
