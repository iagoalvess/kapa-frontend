import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeCartoes, EsqueletoDeTabela } from '@/components/Esqueleto'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { cn } from '@/lib/utils'

/**
 * A tela de lista antes da resposta, com a forma da tela pronta: os números do topo (rótulos já à vista, valores
 * por chegar), a barra de filtros no mesmo lugar, a tabela num cartão e a coluna lateral.
 *
 * Existe porque cada tela desenhava o seu "carregando" — um cartão genérico de texto no lugar de faixa, filtros e
 * lateral —, e a página inteira pulava quando a resposta chegava (revisão de 15/10/2026).
 *
 * @param indicadores Os rótulos e ícones da `FaixaDeIndicadores` da tela; ausente, sem faixa.
 * @param principal O filtro principal que já pode ser mostrado (Festa/Colação), no lugar em que fica depois.
 * @param colunas Colunas da tabela.
 * @param lateral Quando a coluna da direita aparece: `lg` ou `xl`, como na tela; `false`, sem lateral.
 */
export function EsqueletoDeLista({
  indicadores,
  principal = null,
  colunas = 4,
  lateral = 'lg',
}: {
  indicadores?: { rotulo: string; icone: LucideIcon }[]
  principal?: ReactNode
  colunas?: number
  lateral?: 'lg' | 'xl' | false
}) {
  return (
    <>
      {indicadores ? (
        <FaixaDeIndicadores
          rotulo="Carregando"
          indicadores={indicadores.map((indicador) => ({ ...indicador, valor: null }))}
        />
      ) : null}
      <FiltrosDaPlanilha principal={principal} />
      <div
        className={cn(
          'grid items-start gap-5',
          lateral === 'lg' && 'lg:grid-cols-[minmax(0,1fr)_22rem]',
          lateral === 'xl' && 'xl:grid-cols-[minmax(0,1fr)_22rem]',
        )}
      >
        <Cartao className="min-w-0">
          <EsqueletoDeTabela linhas={8} colunas={colunas} />
        </Cartao>
        {lateral ? (
          <EsqueletoDeCartoes
            quantidade={2}
            altura="h-56"
            className={cn('hidden md:grid-cols-1', lateral === 'lg' ? 'lg:grid' : 'xl:grid')}
          />
        ) : null}
      </div>
    </>
  )
}
