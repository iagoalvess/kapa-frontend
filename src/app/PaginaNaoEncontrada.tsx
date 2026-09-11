import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'

export function PaginaNaoEncontrada() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <Button asChild>
        <Link to={ROTAS.inicio}>Voltar ao início</Link>
      </Button>
    </main>
  )
}
