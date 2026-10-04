import { ChevronLeft, ChevronRight, Ellipsis, Plus, Search, SlidersHorizontal } from 'lucide-react'
import type { ReactNode } from 'react'
import { Cartao } from '@/components/Cartao'
import { Chip } from '@/components/Chip'
import { Tabela } from '@/components/Planilha'
import { Button } from '@/components/ui/button'

/** Só apresentação: a área bloqueada mantém todo o exemplo inerte e fora da acessibilidade. */
export function BarraDaPrevia({
  busca,
  filtros,
  acao,
  total,
}: {
  busca: string
  filtros: string[]
  acao?: string
  total: number
}) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Chip ativo tom="claro" contagem={total}>
          Todos
        </Chip>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="bg-card text-muted-foreground flex h-9 items-center gap-2 rounded-full border px-3 text-sm">
            <Search className="size-4" />
            {busca}
          </span>
          <Button variant="outline" size="sm">
            <SlidersHorizontal />
            Filtros
          </Button>
          {acao ? (
            <Button size="sm">
              <Plus />
              {acao}
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filtros.map((filtro) => (
          <Chip key={filtro} ativo={false}>
            {filtro}
          </Chip>
        ))}
        <span className="text-muted-foreground ml-auto text-sm">Mostrando 10 de {total}</span>
      </div>
    </div>
  )
}

export function TabelaDaPrevia({
  titulo,
  colunas,
  linhas,
}: {
  titulo: string
  colunas: string[]
  linhas: { chave: string; celulas: ReactNode[] }[]
}) {
  return (
    <Cartao rotulo={titulo} className="min-w-0 px-5 py-2">
      <Tabela
        emLista
        legenda={titulo}
        cabecalho={
          <>
            {colunas.map((coluna) => (
              <th key={coluna} className="py-3 pr-4 font-normal">
                {coluna}
              </th>
            ))}
            <th>
              <span className="sr-only">Ações</span>
            </th>
          </>
        }
      >
        {linhas.map(({ chave, celulas }) => (
          <tr key={chave} className="border-b last:border-0">
            {celulas.map((celula, indice) => (
              <td key={colunas[indice]} className="py-4 pr-4">
                {celula}
              </td>
            ))}
            <td className="text-muted-foreground py-4">
              <Ellipsis className="size-4" />
            </td>
          </tr>
        ))}
      </Tabela>
    </Cartao>
  )
}

export function RodapeDaPrevia({ total }: { total: number }) {
  return (
    <div className="text-muted-foreground flex items-center justify-between gap-3 px-1 text-sm">
      <span>{total} registros</span>
      <div className="flex items-center gap-3">
        <ChevronLeft className="size-4" />
        <span>Página 1 de {Math.ceil(total / 10)}</span>
        <ChevronRight className="size-4" />
      </div>
    </div>
  )
}
