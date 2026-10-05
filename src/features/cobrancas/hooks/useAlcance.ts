import { useQuery } from '@tanstack/react-query'
import { simularPreco, simularRateio } from '../api/cobrancas.api'
import { chaves } from './chaves'
import { useComAtraso } from './useComAtraso'

/** O tempo parado depois da última tecla antes de perguntar à API de novo. */
const ATRASO = 400

/**
 * Quantos de quem já aderiu o preço novo alcançaria, e quanto muda — a pergunta da D21.
 *
 * @param habilitado Só com o item em uso e o preço mudado: sem isso não há o que perguntar.
 */
export function useAlcanceDoPreco(
  planoId: string,
  itemId: string | undefined,
  valor: number,
  habilitado: boolean,
) {
  const atrasado = useComAtraso(valor, ATRASO)

  return useQuery({
    queryKey: chaves.alcanceDoPreco(planoId, itemId ?? '', atrasado),
    queryFn: ({ signal }) => simularPreco(planoId, itemId!, atrasado, signal),
    enabled: habilitado && itemId !== undefined,
  })
}

/**
 * Quantos formandos o rateio alcançaria hoje, e o total (D19) — a conta antes de confirmar.
 *
 * @param habilitado Só com o rateio marcado.
 */
export function useAlcanceDoRateio(planoId: string, alvo: string[], valor: number, habilitado: boolean) {
  const atrasado = useComAtraso(valor, ATRASO)

  return useQuery({
    queryKey: chaves.alcanceDoRateio(planoId, alvo, atrasado),
    queryFn: ({ signal }) => simularRateio(planoId, alvo, atrasado, signal),
    enabled: habilitado,
    placeholderData: (anterior) => anterior,
  })
}
