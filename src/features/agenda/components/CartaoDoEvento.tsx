import { Clock3, MapPin, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatarData, formatarDiaDaSemana, formatarHora, formatarMesDoDia } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { type EventoDaTurma, ROTULOS_DE_TIPO } from '@/types/agenda'
import { COR_DO_TIPO, ICONE_DO_TIPO } from './iconeDoTipo'
import { IndicadorDoEvento } from './IndicadorDoEvento'
import { COR_DA_DATA } from './SeloDoEvento'

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

/**
 * Um evento no quadro: o bloco da data à esquerda, na cor da situação, e à direita o tipo, o título,
 * a hora, o local e a descrição.
 *
 * A data em bloco é o que se lê primeiro — é uma agenda, e "26 sáb set" responde "quando" antes de
 * qualquer título. O tipo não se repete numa linha própria: a pílula já o diz, com o ícone.
 *
 * O cartão inteiro abre os detalhes; editar e excluir ficam fora do botão, no pé, porque botão
 * dentro de botão não existe no HTML.
 */
export function CartaoDoEvento({ evento, passado = false, aoAbrir, aoExcluir, aoEditar }: Props) {
  const cancelado = evento.situacao === 'Cancelado'
  const Icone = ICONE_DO_TIPO[evento.tipo]
  const iconeDeAcao = 'text-muted-foreground hover:text-foreground hover:bg-muted size-8 rounded-full'
  const linha = 'text-muted-foreground flex items-center gap-2 text-xs'

  return (
    <li className={cn('bg-card relative min-w-0 rounded-2xl', passado && 'opacity-60')}>
      <button
        type="button"
        onClick={aoAbrir}
        className="focus-visible:ring-ring hover:bg-muted/40 grid w-full grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl p-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {/* A data por extenso no rótulo, para o leitor de tela não ouvir só "26 sáb set". */}
        <time
          dateTime={evento.data}
          aria-label={formatarData(evento.data)}
          className={cn(
            'flex w-14 flex-col items-center self-start rounded-xl py-2 leading-tight uppercase',
            COR_DA_DATA[evento.situacao],
          )}
        >
          <span className="text-foreground text-2xl font-semibold tabular-nums">
            {evento.data.slice(8, 10)}
          </span>
          <span className="text-foreground text-xs font-semibold">{formatarDiaDaSemana(evento.data)}</span>
          <span className="text-muted-foreground text-xs">{formatarMesDoDia(evento.data)}</span>
        </time>

        <span className="grid min-w-0 grid-cols-1 content-start gap-1.5">
          <span className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                COR_DO_TIPO[evento.tipo],
              )}
            >
              <Icone className="size-3" aria-hidden />
              {ROTULOS_DE_TIPO[evento.tipo]}
            </span>
            <IndicadorDoEvento situacao={evento.situacao} />
          </span>

          <span
            className={cn(
              'text-foreground leading-snug font-semibold',
              cancelado && 'text-muted-foreground line-through',
            )}
          >
            {evento.titulo}
          </span>

          <span className={linha}>
            <Clock3 className="size-3.5 shrink-0" aria-hidden />
            {evento.hora ? `${formatarHora(evento.hora)}h` : 'Dia inteiro'}
          </span>

          {evento.local ? (
            <span className={linha}>
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">{evento.local}</span>
            </span>
          ) : null}

          {evento.descricao ? (
            <span className="text-muted-foreground mt-1 line-clamp-3 border-t pt-2 text-sm">
              {evento.descricao}
            </span>
          ) : null}

          {/* O espaço do pé, para os botões de fora não cobrirem a última linha. */}
          {aoEditar || aoExcluir ? <span className="h-6" aria-hidden /> : null}
        </span>
      </button>

      <span className="absolute right-2 bottom-2 flex">
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
