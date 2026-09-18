import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import type { ItemDaFesta } from '@/types/festa'
import { FormularioDoItem } from './FormularioDoItem'

interface Props {
  /** Aberto com um item, corrige; aberto sem, cria; fechado, é `false`. */
  aberto: false | { item?: ItemDaFesta }
  /** Depois de salvar, cancelar ou apertar Esc. */
  aoFechar: () => void
}

/**
 * O cadastro do item num diálogo — a tela é uma grade de cartões, e não tem coluna lateral.
 *
 * O formulário remonta a cada abertura (a chave), então corrigir um item e depois criar outro não
 * deixa valor da vez anterior no campo.
 */
export function DialogoDeItem({ aberto, aoFechar }: Props) {
  const editavel = useEscritaLiberada()
  const item = aberto ? aberto.item : undefined

  return (
    <DialogoDeFormulario
      aberto={!!aberto}
      aoFechar={aoFechar}
      titulo={item ? 'Editar item da festa' : 'Novo item da festa'}
      descricao={
        item
          ? 'O que a turma lê sobre este item. Quem foi contratado e quanto já foi pago vêm das despesas.'
          : 'O que a turma vai ter. O valor é uma estimativa até a primeira despesa ser lançada.'
      }
      largura="largo"
    >
      <FormularioDoItem key={item?.id ?? 'novo'} editando={item} editavel={editavel} aoConcluir={aoFechar} />
    </DialogoDeFormulario>
  )
}
