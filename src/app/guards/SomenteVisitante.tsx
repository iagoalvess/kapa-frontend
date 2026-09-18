import { Navigate, Outlet } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { useSessao } from '@/hooks/useSessao'

/**
 * O contrário de `ExigeAutenticacao`: as telas que só fazem sentido sem sessão.
 *
 * Entrar, criar conta e pedir a redefinição são portas de entrada. Com sessão aberta elas não têm
 * o que fazer — e a landing tem um "Entrar" bem visível, então quem já entrou chegava nelas o
 * tempo todo, via o próprio formulário de login e ficava sem saber se continuava logado.
 *
 * Quem quer entrar com outra conta sai primeiro: é o que o "Sair" do menu existe para fazer, e é
 * o que todo produto faz — login aberto com sessão viva é a porta de encavalar duas contas.
 *
 * **Redefinir senha e confirmar e-mail ficam de fora de propósito**: os dois chegam por link de
 * e-mail, e quem clica pode estar com a sessão aberta no mesmo navegador. Mandá-lo para o Início
 * seria engolir o que o e-mail pedia.
 */
export function SomenteVisitante() {
  const { autenticado } = useSessao()

  if (autenticado) return <Navigate to={ROTAS.inicio} replace />

  return <Outlet />
}
