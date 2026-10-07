import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import type { ItemDaFesta, Proposta } from '@/types/festa'
import type { Despesa, Fornecedor } from '../types/financeiro.types'
import { FormularioDeDespesa } from './FormularioDeDespesa'

interface Props {
  /** Aberto com uma despesa, corrige; aberto sem, lança; fechado, é `false`. */
  aberto: false | { despesa?: Despesa }
  /** Os fornecedores ativos, para o seletor do formulário. */
  fornecedores: Fornecedor[]
  /** Itens da festa, para o seletor do vínculo. */
  itensDaFesta: ItemDaFesta[]
  /** Item vindo do "Contratar esta" de uma proposta da festa: o formulário abre preenchido por ele. */
  contratando?: ItemDaFesta
  /** A proposta escolhida: título e preço do lançamento vêm dela. */
  proposta?: Proposta
  /** Depois de salvar, cancelar ou apertar Esc. */
  aoFechar: () => void
}

/**
 * O lançamento da despesa num diálogo — na lista não há mais coluna lateral para ele.
 *
 * O formulário remonta a cada abertura (a chave), então corrigir uma linha e depois lançar outra
 * não deixa valor da vez anterior no campo.
 */
export function DialogoDeDespesa({
  aberto,
  fornecedores,
  itensDaFesta,
  contratando,
  proposta,
  aoFechar,
}: Props) {
  const editavel = useEscritaLiberada()
  const despesa = aberto ? aberto.despesa : undefined

  return (
    <DialogoDeFormulario
      aberto={!!aberto}
      aoFechar={aoFechar}
      titulo={
        despesa
          ? 'Editar despesa'
          : contratando
            ? `Contratar ${proposta ? proposta.titulo : contratando.titulo}`
            : 'Nova despesa'
      }
      descricao={
        despesa
          ? 'As mudanças valem apenas para esta despesa. Você pode corrigir uma despesa paga, mas não cancelá-la.'
          : contratando
            ? 'Os dados da proposta já estão preenchidos. Informe o fornecedor, as parcelas e os vencimentos do contrato.'
            : 'Se o pagamento for parcelado, cada vencimento aparecerá separadamente. Se já foi pago, anexe o comprovante.'
      }
      largura="largo"
    >
      <FormularioDeDespesa
        key={despesa?.id ?? proposta?.id ?? contratando?.id ?? 'nova'}
        fornecedores={fornecedores}
        itensDaFesta={itensDaFesta}
        contratando={contratando}
        proposta={proposta}
        editando={despesa}
        editavel={editavel}
        aoConcluir={aoFechar}
      />
    </DialogoDeFormulario>
  )
}
