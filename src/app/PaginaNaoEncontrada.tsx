import { Link } from 'react-router'
import mascoteLuneta from '@/assets/mascote/binoculo.webp'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'

export function PaginaNaoEncontrada() {
  return (
    <main className="motion-safe:animate-entrar flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <img src={mascoteLuneta} alt="" className="w-44 drop-shadow-xl" />
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Procuramos por todo canto e não achamos este endereço. Ele pode ter mudado ou nunca ter existido.
      </p>
      <Button asChild>
        <Link to={ROTAS.inicio}>Voltar ao início</Link>
      </Button>
    </main>
  )
}
