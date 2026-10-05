import { Link } from 'react-router'
import mascoteLuneta from '@/assets/mascote/binoculo.webp'
import { EstadoDeErro } from '@/components/EstadoDeErro'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'

/**
 * O 404 do app e do site.
 *
 * @param destino Para onde o botão volta: o Início no app, a página institucional no site.
 */
export function PaginaNaoEncontrada({ destino = ROTAS.inicio }: { destino?: string }) {
  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <EstadoDeErro
        titulo="Página não encontrada"
        descricao="Procuramos por todo canto e não achamos este endereço. Ele pode ter mudado ou nunca ter existido."
        mascote={mascoteLuneta}
        nivelDoTitulo={1}
      >
        <Button asChild className="rounded-full px-6">
          <Link to={destino}>Voltar ao início</Link>
        </Button>
      </EstadoDeErro>
    </main>
  )
}
