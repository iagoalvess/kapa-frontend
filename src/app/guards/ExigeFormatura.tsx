import { Navigate, Outlet, useLocation } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { useFormaturaAtiva } from '@/hooks/useSessao'

/**
 * O que quem foi desligado ainda abre: o extrato dele, o termo dele e o portal de privacidade.
 *
 * Os dois primeiros espelham a política `TitularDoProprioHistorico` do backend, e a lista é curta
 * pelo mesmo motivo que ela: quem sai deixa de dever, mas não deixa de ter pago (P5 da Sprint 15).
 * O portal LGPD entra porque é do **titular** e não da turma — a API dele pede só sessão — e é o
 * direito de acesso que não pode depender de continuar na formatura.
 *
 * Mural, acervo, caixa e cadastro ficam de fora: a API os recusa com 403, e mandar a pessoa para lá
 * é entregar uma tela de erro no lugar de uma explicação.
 */
const LEITURAS_DO_DESLIGADO: readonly string[] = [ROTAS.extrato, ROTAS.adesao, ROTAS.minhaPrivacidade]

/**
 * Bloqueia o ramo que depende de uma formatura escolhida, e o recorta para quem já saiu dela.
 *
 * Guarda cuida de **navegação**, não de segurança: quem recusa o dado é a API, com a política
 * `FormaturaSelecionada`. O que esta guarda evita é a tela vazia — sem a claim, toda consulta
 * volta sem linha nenhuma e o usuário não teria como saber por quê.
 *
 * O destino pretendido vai no `state` para a seleção devolver o usuário ao lugar certo.
 *
 * O desligado é desviado para o extrato em vez de perder a sessão: ele mantém a turma na sessão só
 * para ler o próprio histórico, e sem o desvio colecionaria 403 clicando no menu.
 */
export function ExigeFormatura() {
  const { selecionada, desligadoEm } = useFormaturaAtiva()
  const local = useLocation()

  if (!selecionada) {
    return <Navigate to={ROTAS.selecionarFormatura} state={{ de: local.pathname + local.search }} replace />
  }

  if (desligadoEm && !LEITURAS_DO_DESLIGADO.some((rota) => local.pathname.startsWith(rota))) {
    return <Navigate to={ROTAS.extrato} replace />
  }

  return <Outlet />
}
