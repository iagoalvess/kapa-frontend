import { Link, type LinkProps } from 'react-router'
import { useEstadoComOrigem } from '@/hooks/useNavegacaoDaPagina'

/** Atalho entre telas: deixa o nome e o endereço da origem para a seta da próxima página. */
export function LinkDaPagina({ state, ...props }: LinkProps) {
  const origem = useEstadoComOrigem()
  return <Link {...props} state={origem ? { ...state, ...origem } : state} />
}
