import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatarNumero } from '@/lib/formato'

interface Props {
  /** Página atual, começando em 1. */
  pagina: number
  totalPaginas: number
  /** Total de registros que atendem ao filtro. */
  total: number
  /** Chamado com a página pedida. Quem usa grava na URL. */
  aoMudar: (pagina: number) => void
  /** Desabilita a navegação enquanto a próxima página carrega. */
  ocupado?: boolean
}

/**
 * Navegação entre páginas de uma listagem da API (`Pagina<T>`).
 *
 * Só desenha e avisa: a página atual vive na URL, e é a tela que a lê e grava — assim voltar,
 * recarregar e mandar o link devolvem o mesmo lugar.
 *
 * @returns `null` quando tudo cabe numa página.
 */
export function Paginacao({ pagina, totalPaginas, total, aoMudar, ocupado = false }: Props) {
  if (totalPaginas <= 1) return null

  return (
    <nav
      aria-label="Paginação"
      className="text-muted-foreground mt-4 flex items-center justify-between gap-4 text-sm"
    >
      <span>
        Página {formatarNumero(pagina)} de {formatarNumero(totalPaginas)} · {formatarNumero(total)} no total
      </span>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={ocupado || pagina <= 1}
          onClick={() => aoMudar(pagina - 1)}
        >
          <ChevronLeft />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={ocupado || pagina >= totalPaginas}
          onClick={() => aoMudar(pagina + 1)}
        >
          Próxima
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
