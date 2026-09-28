import type { ReactNode } from 'react'
import { Chip } from '@/components/Chip'

/** Uma opção de pagamento, como a tela a oferece. */
export interface OpcaoDePagamento {
  /** O que identifica a opção entre as irmãs. */
  chave: string
  rotulo: string
  icone?: ReactNode
}

interface Props {
  /** Só as opções que o contexto permite — quem filtra é a API, e a tela não inventa meio. */
  opcoes: OpcaoDePagamento[]
  /** A chave da opção escolhida. */
  escolhida?: string
  aoEscolher: (chave: string) => void
}

/**
 * "Como você quer pagar?" — as pílulas de escolha do meio, iguais na parcela e na loja.
 *
 * Com uma opção só não desenha nada: a tela é a de sempre, no mesmo número de cliques (decisão 3 da
 * Sprint 18), e quem chama já mostra o conteúdo do meio único.
 */
export function ComoVoceQuerPagar({ opcoes, escolhida, aoEscolher }: Props) {
  if (opcoes.length < 2) return null

  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">Como você quer pagar?</legend>
      {opcoes.map((opcao) => (
        <Chip key={opcao.chave} ativo={opcao.chave === escolhida} onClick={() => aoEscolher(opcao.chave)}>
          {opcao.icone}
          {opcao.rotulo}
        </Chip>
      ))}
    </fieldset>
  )
}
