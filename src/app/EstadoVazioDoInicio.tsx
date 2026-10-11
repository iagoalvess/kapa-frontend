import type { LucideIcon } from 'lucide-react'
/** Apresentação compartilhada dos atalhos do Início sem registros. */
export function EstadoVazioDoInicio({
  icone: Icone,
  titulo,
  descricao,
}: {
  icone: LucideIcon
  titulo: string
  descricao: string
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icone className="text-muted-foreground size-6 shrink-0" strokeWidth={1.6} aria-hidden />
      <div className="grid gap-1">
        <p className="font-medium">{titulo}</p>
        <p className="text-muted-foreground text-sm">{descricao}</p>
      </div>
    </div>
  )
}
