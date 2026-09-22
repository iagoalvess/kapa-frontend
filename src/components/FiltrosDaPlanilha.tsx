import type { ReactNode } from 'react'
import { CampoDeBusca } from '@/components/CampoDeBusca'
import { formatarNumero } from '@/lib/formato'

interface Props {
  /** Pílula(s) da primeira linha — normalmente o "Todos", que é tirar o filtro. */
  principal: ReactNode
  /** Pílulas da segunda linha, agrupadas num `fieldset`. */
  filtros?: ReactNode
  /** Nomeia o grupo da segunda linha para o leitor de tela. */
  legenda?: string
  /** A busca da lista: cada tela diz o que se busca ("Buscar membro"). Ausente, a linha fica só com as ações. */
  busca?: { valor: string; rotulo: string; aoBuscar: (termo: string | null) => void }
  /** Botões à direita da busca: o painel de filtros e a ação da tela. */
  acoes?: ReactNode
  /** O que fica colado à esquerda da contagem: a ação do lote, uma legenda de cores. */
  antesDaContagem?: ReactNode
  /** "Mostrando 20 de 80 membros" — o da página sobre o total do filtro. */
  contagem?: { mostrando: number; total: number; unidade: string }
  /** Texto no lugar da contagem, para a tela que não lista registros ("1 de janeiro a 16 de setembro"). */
  nota?: ReactNode
}

/**
 * As duas linhas acima de toda `Planilha`: em cima o filtro principal, a busca e as ações; embaixo
 * os demais filtros e quantos itens a página está mostrando.
 *
 * Só desenha e avisa — o filtro vive na URL da tela, que monta as pílulas e recebe a busca.
 */
export function FiltrosDaPlanilha({
  principal,
  filtros,
  legenda,
  busca,
  acoes,
  antesDaContagem,
  contagem,
  nota,
}: Props) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {principal}

        <div className="ml-auto flex w-full gap-2 sm:w-auto">
          {busca ? (
            <CampoDeBusca valor={busca.valor} rotulo={busca.rotulo} aoBuscar={busca.aoBuscar} />
          ) : null}
          {acoes}
        </div>
      </div>

      {filtros || antesDaContagem || contagem || nota ? (
        <div className="flex flex-wrap items-center gap-2">
          {filtros ? (
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">{legenda ?? 'Filtros'}</legend>
              {filtros}
            </fieldset>
          ) : null}

          {/* Encosta na contagem, e não no rodapé da tela: é aqui que se lê quantos itens a lista
              tem, e é onde a pessoa já está olhando ao terminar de marcar. */}
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {antesDaContagem}

            {contagem && contagem.mostrando > 0 ? (
              <p className="text-muted-foreground text-sm">
                Mostrando {formatarNumero(contagem.mostrando)} de {formatarNumero(contagem.total)}{' '}
                {contagem.unidade}
              </p>
            ) : null}

            {nota ? <p className="text-muted-foreground text-sm">{nota}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
