import { useSearchParams } from 'react-router'
import type { Ordenacao } from '@/components/Planilha'
import type { PaginacaoRequest } from '@/types/paginacao'

/** Nomes dos parâmetros na URL. Curtos porque dividem a barra de endereço com os filtros da tela. */
const COLUNA = 'ordenar'
const DESCENDENTE = 'desc'

/**
 * A ordenação da lista, guardada na URL como todo filtro.
 *
 * O ciclo é o de três estados: o primeiro clique numa coluna ordena crescente, o segundo inverte, o
 * terceiro tira a ordenação e devolve a ordem padrão da listagem. Clicar em outra coluna recomeça o
 * ciclo nela — ordenar por duas colunas ao mesmo tempo é o tipo de coisa que ninguém descobre e
 * ninguém desfaz.
 *
 * @param atualizar O gravador de filtros da tela — o mesmo que já zera a página a cada mudança, que
 *   é o que tem de acontecer aqui: ordenação nova reordena a lista inteira, e a página 3 da ordem
 *   antiga não quer dizer nada na nova.
 * @returns O que o `Planilha` espera em `ordenacao`, mais o `filtro` para espalhar na consulta —
 *   assim a tela não repete a tradução de nomes entre a URL e a query da API.
 */
export function useOrdenacao(
  atualizar: (mudancas: Record<string, string | null>) => void,
): Ordenacao & { filtro: Pick<PaginacaoRequest, 'ordenar_por' | 'descendente'> } {
  const [parametros] = useSearchParams()
  const por = parametros.get(COLUNA) ?? undefined
  const descendente = parametros.get(DESCENDENTE) === '1'

  return {
    por,
    descendente,
    // `false` fica de fora: é o padrão do servidor, e sujaria a chave de cache do React Query.
    filtro: { ordenar_por: por, descendente: descendente || undefined },
    aoOrdenar: (coluna) => {
      const crescente = por === coluna && !descendente
      const remover = por === coluna && descendente

      atualizar({
        [COLUNA]: remover ? null : coluna,
        [DESCENDENTE]: crescente ? '1' : null,
      })
    },
  }
}
