import { Search } from 'lucide-react'
import type { FormEvent } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  /** O termo que está na URL. */
  valor: string
  /** Placeholder e nome para o leitor de tela ("Buscar membro"). */
  rotulo: string
  /** Chamado ao enviar, com o termo aparado — vazio vira `null`, que tira o filtro. */
  aoBuscar: (termo: string | null) => void
  className?: string
}

/**
 * A busca em pílula das listas, ao lado dos filtros: busca ao apertar Enter, não a cada tecla.
 *
 * O termo vive na URL, com o resto dos filtros; o campo só o edita. A chave pelo valor faz voltar no
 * histórico repor o texto do campo.
 */
export function CampoDeBusca({ valor, rotulo, aoBuscar, className }: Props) {
  const buscar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const termo = new FormData(evento.currentTarget).get('busca')
    aoBuscar(typeof termo === 'string' && termo.trim() ? termo.trim() : null)
  }

  return (
    <search className={cn('flex-1 sm:w-64', className)}>
      <form onSubmit={buscar} className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <input
          key={valor}
          name="busca"
          type="search"
          defaultValue={valor}
          placeholder={rotulo}
          aria-label={rotulo}
          className="border-border placeholder:text-texto-muted focus-visible:ring-ring h-8 w-full rounded-full border bg-transparent pr-3 pl-9 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <button type="submit" className="sr-only">
          Buscar
        </button>
      </form>
    </search>
  )
}
