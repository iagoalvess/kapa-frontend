import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A lista de dados de um cadastro: os meios de recebimento, o fornecedor, a despesa, o aceite.
 *
 * @param rotulo Título acima da lista, quando o cartão traz mais de um bloco de dados. Sem ele a
 *   lista é a única do cartão, e quem a nomeia é o cabeçalho.
 * @param className Do lado de quem chama; o espaçamento é daqui.
 */
export function ListaDeDados({
  rotulo,
  children,
  className,
}: {
  rotulo?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid gap-2', className)}>
      {rotulo ? (
        <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{rotulo}</h3>
      ) : null}
      <dl className="@container grid gap-3 text-[15px]">{children}</dl>
    </div>
  )
}

/**
 * Uma linha da lista: ícone, rótulo em cinza e o valor, separados por um traço.
 *
 * Em lista larga o rótulo tem coluna própria, entre 7 e 11rem. Em lista estreita — a coluna lateral, o
 * diálogo, o celular — o valor desce para baixo do rótulo e ganha a largura inteira: com a coluna do
 * rótulo ao lado, sobravam uns 150px, e um e-mail ou um código quebrava em quatro linhas. Quem decide é
 * a largura da lista (container query), não a da tela: a mesma lista mora nos dois lugares. O traço
 * embaixo separa um dado do outro: em cinco pares seguidos, sem ele o olho procura onde um acaba e o
 * outro começa.
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
    <div className="border-border grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-3 gap-y-0.5 border-b pb-3 last:border-0 last:pb-0 @lg:grid-cols-[1.25rem_minmax(7rem,11rem)_minmax(0,1fr)] @lg:gap-x-6">
      <Icone className="text-muted-foreground mt-0.5 size-4" strokeWidth={1.75} aria-hidden />
      <dt className="text-muted-foreground">{rotulo}</dt>
      <dd className="text-foreground col-start-2 font-medium break-words @lg:col-start-3 @lg:row-start-1">
        {children}
      </dd>
    </div>
  )
}
