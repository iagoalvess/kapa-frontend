import { KeyRound, LogOut } from 'lucide-react'
import { Link } from 'react-router'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { useSair } from '@/features/auth'
import { SeletorDeFormatura } from '@/features/formaturas'
import { useSessao } from '@/hooks/useSessao'

export function Cabecalho() {
  const { usuario } = useSessao()
  const sair = useSair()

  return (
    <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
        <LogoKapa className="h-7" />

        {/* A navegação entra aqui: um <NavLink> por feature, escondido por usePerfil() quando
            a rota for restrita. */}
        <nav className="flex items-center gap-4" />

        <div className="ml-auto flex items-center gap-1">
          <SeletorDeFormatura />

          <span className="text-muted-foreground mr-2 hidden text-sm sm:inline">{usuario?.nome}</span>

          <Button variant="ghost" size="icon" aria-label="Alterar senha" asChild>
            <Link to={ROTAS.alterarSenha}>
              <KeyRound />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Sair"
            disabled={sair.isPending}
            onClick={() => sair.mutate()}
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  )
}
