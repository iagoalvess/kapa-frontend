import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import type { Despesa, Fornecedor } from '../types/financeiro.types'
import { FormularioDeDespesa } from './FormularioDeDespesa'

interface Props {
  /** Aberto com uma despesa, corrige; aberto sem, lança; fechado, é `false`. */
  aberto: false | { despesa?: Despesa }
  /** Os fornecedores ativos, para o seletor do formulário. */
  fornecedores: Fornecedor[]
  /** Depois de salvar, cancelar ou apertar Esc. */
  aoFechar: () => void
}

/**
 * O lançamento da despesa num diálogo — na lista não há mais coluna lateral para ele.
 *
 * O formulário remonta a cada abertura (a chave), então corrigir uma linha e depois lançar outra
 * não deixa valor da vez anterior no campo.
 */
export function DialogoDeDespesa({ aberto, fornecedores, aoFechar }: Props) {
  const editavel = useEscritaLiberada()
  const despesa = aberto ? aberto.despesa : undefined

  return (
    <DialogoDeFormulario
      aberto={!!aberto}
      aoFechar={aoFechar}
      titulo={despesa ? 'Corrigir despesa' : 'Lançar despesa'}
      descricao={
        despesa
          ? 'A correção vale para esta linha. Despesa paga também se corrige — o que não se faz é cancelá-la.'
          : 'Parcelada gera uma linha por vencimento. Se já foi paga, anexe o comprovante.'
      }
      largura="largo"
    >
      <FormularioDeDespesa
        key={despesa?.id ?? 'nova'}
        fornecedores={fornecedores}
        editando={despesa}
        editavel={editavel}
        aoConcluir={aoFechar}
      />
    </DialogoDeFormulario>
  )
}
