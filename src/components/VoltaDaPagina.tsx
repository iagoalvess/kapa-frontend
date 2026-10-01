import type { ReactNode } from 'react'
import { ContextoDeVoltaDaPagina, useOrigemDaNavegacao } from '@/hooks/useNavegacaoDaPagina'
import { LinkDeVolta } from './LinkDeVolta'

/** A saída contextual fica abaixo do título, inclusive durante carregamento, erro ou bloqueio. */
export function VoltaDaPagina({ children }: { children: ReactNode }) {
  const origem = useOrigemDaNavegacao()

  return (
    <>
      {origem ? <LinkDeVolta para={origem.caminho}>{origem.titulo}</LinkDeVolta> : null}
      <ContextoDeVoltaDaPagina value={Boolean(origem)}>{children}</ContextoDeVoltaDaPagina>
    </>
  )
}
