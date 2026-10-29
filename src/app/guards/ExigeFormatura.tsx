import { Navigate, Outlet, useLocation } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { PERFIS } from '@/config/perfis'
import { useFormaturaAtiva, usePerfil } from '@/hooks/useSessao'

/** Quem foi desligado ainda pode consultar seu extrato, recibos e termo de adesão. */
const LEITURAS_DO_DESLIGADO: readonly string[] = [ROTAS.extrato, ROTAS.recibos, ROTAS.adesao]

/**
 * Bloqueia o ramo que depende de uma formatura escolhida, e o recorta para quem já saiu dela.
 *
 * Guarda cuida de **navegação**, não de segurança: quem recusa o dado é a API — toda política de
 * domínio exige a claim `formatura_id` (`MembroDaFormatura` e as de papel). O que esta guarda evita é a tela vazia — sem a claim, toda consulta
 * volta sem linha nenhuma e o usuário não teria como saber por quê.
 *
 * O destino pretendido vai no `state` para a seleção devolver o usuário ao lugar certo.
 *
 * Quem é do Kapa (`Administrador`) sem turma na sessão vai para o painel (Sprint 44, E1): é perfil de plataforma,
 * e a tela de "você ainda não está em uma formatura" não é a porta dele. É por aqui que o login o leva ao painel —
 * o destino padrão do login é o Início, que mora neste ramo.
 *
 * O desligado é desviado para o extrato em vez de perder a sessão: ele mantém a turma na sessão só
 * para ler o próprio histórico, e sem o desvio colecionaria 403 clicando no menu.
 */
export function ExigeFormatura() {
  const { selecionada, desligadoEm } = useFormaturaAtiva()
  const ehDaKapa = usePerfil().tem(PERFIS.administrador)
  const local = useLocation()

  if (!selecionada && ehDaKapa) return <Navigate to={ROTAS.painelVisaoGeral} replace />

  if (!selecionada) {
    return <Navigate to={ROTAS.selecionarFormatura} state={{ de: local.pathname + local.search }} replace />
  }

  if (desligadoEm && !LEITURAS_DO_DESLIGADO.some((rota) => local.pathname.startsWith(rota))) {
    return <Navigate to={ROTAS.extrato} replace />
  }

  return <Outlet />
}
