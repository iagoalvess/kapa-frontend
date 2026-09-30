import { cn } from '@/lib/utils'

/** O que cada cor de mesa quer dizer no editor do salão. */
export function Legenda() {
  const itens = [
    { rotulo: 'Com dono', cor: 'bg-brand-tint border-brand' },
    { rotulo: 'Reservada', cor: 'bg-evento-festa/20 border-evento-festa' },
    { rotulo: 'Sem dono', cor: 'bg-card border-muted-foreground/60' },
  ]

  return (
    <ul className="text-muted-foreground flex flex-wrap gap-4 text-sm" aria-label="Legenda">
      {itens.map((item) => (
        <li key={item.rotulo} className="flex items-center gap-1.5">
          <span aria-hidden className={cn('size-3 rounded-full border-2', item.cor)} />
          {item.rotulo}
        </li>
      ))}
    </ul>
  )
}
