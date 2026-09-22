import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

/** Acesso ao conteúdo completo de um cartão, com destino anunciado ao leitor de tela. */
export function LinkDoCartao({ to, rotulo }: { to: string; rotulo: string }) {
  return (
    <Link
      to={to}
      aria-label={rotulo}
      title={rotulo}
      className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <ArrowUpRight className="size-5" aria-hidden />
    </Link>
  )
}
