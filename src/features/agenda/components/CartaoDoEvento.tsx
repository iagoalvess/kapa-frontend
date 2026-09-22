import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatarData, formatarDiaDaSemana, formatarHora } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { type EventoDaTurma, ROTULOS_DE_TIPO } from '@/types/agenda'
import { COR_DA_SITUACAO } from './SeloDoEvento'
import { IndicadorDoEvento } from './IndicadorDoEvento'

interface Props {
  evento: EventoDaTurma
  /** Data que já passou: o cartão vem apagado, para o presente se destacar no quadro. */
  passado?: boolean
  /** Abre os detalhes em leitura, para qualquer papel. */
  aoAbrir: () => void
  /** Ação da gestão, fora do formulário de edição. */
  aoExcluir?: () => void
  aoEditar?: () => void
}

/** Cartão compacto: data, título e local, com cor e ícone indicando a situação. */
export function CartaoDoEvento({ evento, passado = false, aoAbrir, aoExcluir, aoEditar }: Props) {
  const cancelado = evento.situacao === 'Cancelado'
  const iconeDeAcao = 'text-muted-foreground hover:text-foreground hover:bg-muted size-7 rounded-full'

  return (
    <li className={cn('relative', passado && 'opacity-60')}>
      <button
        type="button"
        onClick={aoAbrir}
        className={cn(
          'focus-visible:ring-ring grid w-full gap-1 rounded-xl border-l-2 px-3 py-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          COR_DA_SITUACAO[evento.situacao],
        )}
      >
        <span className="flex items-center justify-between gap-2">
          {/* A data por extenso no rótulo, para o leitor de tela não ouvir só "26 sáb". */}
          <time
            dateTime={evento.data}
            aria-label={formatarData(evento.data)}
            className="text-foreground text-sm font-semibold tabular-nums"
          >
            {evento.data.slice(8, 10)}
            <span className="text-muted-foreground ml-1 text-xs font-normal">
              {formatarDiaDaSemana(evento.data)}
            </span>
            {evento.hora ? (
              <span className="text-muted-foreground ml-1.5 text-xs font-normal tabular-nums">
                {formatarHora(evento.hora)}h
              </span>
            ) : null}
          </time>

          <IndicadorDoEvento situacao={evento.situacao} />
        </span>

        <span
          className={cn(
            'text-foreground text-sm leading-snug font-semibold',
            cancelado && 'text-muted-foreground line-through',
          )}
        >
          {evento.titulo}
        </span>

        <span className={cn('text-muted-foreground truncate text-xs', (aoEditar || aoExcluir) && 'pr-14')}>
          {[ROTULOS_DE_TIPO[evento.tipo], evento.local].filter(Boolean).join(' · ')}
        </span>
      </button>
      <span className="absolute right-1 bottom-1 flex">
        {aoEditar ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={iconeDeAcao}
            aria-label={`Editar ${evento.titulo}`}
            title="Editar"
            onClick={aoEditar}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
        ) : null}
        {aoExcluir ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={iconeDeAcao}
            aria-label={`Excluir ${evento.titulo}`}
            title="Excluir"
            onClick={aoExcluir}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        ) : null}
      </span>
    </li>
  )
}
