import { ArrowDown, ArrowUp } from 'lucide-react'
import { Chip } from '@/components/Chip'
import type { Ordenacao } from '@/components/Planilha'

/** Uma ordem oferecida pelo painel: a chave que o `useOrdenacao` grava e o rótulo que se lê. */
export interface OpcaoDeOrdenacao {
  por: string
  rotulo: string
}

/**
 * A ordenação da lista dentro do painel "Filtros", em pílulas.
 *
 * É a mesma ordenação do cabeçalho — o ciclo de três estados do `useOrdenacao`: o primeiro clique
 * ordena crescente, o segundo inverte, o terceiro volta à ordem padrão. A seta na pílula ligada diz
 * o sentido.
 *
 * Existe para a lista que tem busca mas não expõe coluna ordenável à vista, e para reforçar a que
 * expõe: num painel, a ordenação não compete com os filtros que a pessoa veio usar.
 *
 * @param ordenacao O `Ordenacao` que a tela já tirou do `useOrdenacao`.
 * @param opcoes As ordens, na ordem em que aparecem.
 * @param legenda Nomeia o grupo; o padrão é "Ordenar por".
 */
export function FiltroDeOrdenacao({
  ordenacao,
  opcoes,
  legenda = 'Ordenar por',
}: {
  ordenacao: Ordenacao
  opcoes: OpcaoDeOrdenacao[]
  legenda?: string
}) {
  const Seta = ordenacao.descendente ? ArrowDown : ArrowUp

  return (
    <fieldset className="grid gap-2">
      <legend className="text-muted-foreground mb-2 text-sm">{legenda}</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((opcao) => {
          const ativa = ordenacao.por === opcao.por

          return (
            <Chip key={opcao.por} ativo={ativa} onClick={() => ordenacao.aoOrdenar(opcao.por)}>
              {opcao.rotulo}
              {ativa ? <Seta className="size-3.5" aria-hidden /> : null}
            </Chip>
          )
        })}
      </div>
    </fieldset>
  )
}
