import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A lista de dados de um cadastro: a chave PIX, o fornecedor, a despesa, o registro do aceite.
 *
 * @param className Do lado de quem chama; o espaçamento é daqui.
 */
export function ListaDeDados({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn('grid gap-3 text-[15px]', className)}>{children}</dl>
}

/**
 * Uma linha da lista: ícone, rótulo em cinza e o valor, separados por um traço.
 *
 * O rótulo tem coluna própria — entre 7 e 11rem, conforme a largura de quem a hospeda, porque a
 * mesma lista aparece num cartão largo e na coluna lateral estreita. O traço embaixo separa um dado
 * do outro: em cinco pares seguidos, sem ele o olho procura onde um acaba e o outro começa.
 */
export function Dado({
  icone: Icone,
  rotulo,
  children,
}: {
  icone: LucideIcon
  rotulo: string
  children: ReactNode
}) {
  return (
    <div className="border-border grid grid-cols-[1.25rem_minmax(7rem,11rem)_minmax(0,1fr)] items-start gap-x-6 gap-y-3 border-b pb-3 last:border-0 last:pb-0">
      <Icone className="text-muted-foreground mt-0.5 size-4" strokeWidth={1.75} aria-hidden />
      <dt className="text-muted-foreground">{rotulo}</dt>
      <dd className="text-foreground font-medium break-words">{children}</dd>
    </div>
  )
}
