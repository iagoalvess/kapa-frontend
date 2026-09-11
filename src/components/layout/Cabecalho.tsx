import { LogOut, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { env } from '@/config/env'
import { useSair } from '@/features/auth'
import { useSessao } from '@/hooks/useSessao'
import { useTema } from '@/hooks/useTema'

export function Cabecalho() {
  const { usuario } = useSessao()
  const [tema, alternarTema] = useTema()
  const sair = useSair()

  return (
    <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
        <span className="font-semibold">{env.VITE_APP_NOME}</span>

        {/* A navegação entra aqui: um <NavLink> por feature, escondido por usePerfil() quando
            a rota for restrita. */}
        <nav className="flex items-center gap-4" />

        <div className="ml-auto flex items-center gap-1">
          <span className="text-muted-foreground mr-2 hidden text-sm sm:inline">{usuario?.nome}</span>

          <Button
            variant="ghost"
            size="icon"
            aria-label={tema === 'claro' ? 'Usar tema escuro' : 'Usar tema claro'}
            onClick={alternarTema}
          >
            {tema === 'claro' ? <Moon /> : <Sun />}
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
