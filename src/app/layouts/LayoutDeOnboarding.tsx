import { Outlet, useLocation } from 'react-router'
import { estilos, LayoutDeAutenticacao } from '@/components/layout/LayoutDeAutenticacao'
import { useSair } from '@/features/auth'

/**
 * Moldura de quem já entrou mas ainda não está numa formatura: escolher, criar ou entrar por
 * convite acontece aqui, com a cara das telas de conta. O app (barra lateral, cabeçalho) só
 * aparece depois, com a formatura na sessão.
 *
 * Sem a barra lateral, o "Sair" mora no rodapé: quem entrou com a conta errada não pode ficar
 * preso aqui.
 */
export function LayoutDeOnboarding() {
  const { pathname } = useLocation()
  const sair = useSair()

  return (
    <LayoutDeAutenticacao onboarding etapa={pathname}>
      <Outlet />

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Entrou com a conta errada?{' '}
        <button
          type="button"
          disabled={sair.isPending}
          onClick={() => sair.mutate()}
          className={estilos.link}
        >
          Sair
        </button>
      </p>
    </LayoutDeAutenticacao>
  )
}
