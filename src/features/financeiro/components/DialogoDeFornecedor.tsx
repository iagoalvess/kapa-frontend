import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import type { Fornecedor } from '../types/financeiro.types'
import { FormularioDeFornecedor } from './FormularioDeFornecedor'

interface Props {
  /** Aberto com um fornecedor, edita; aberto sem, cadastra; fechado, é `false`. */
  aberto: false | { fornecedor?: Fornecedor }
  /** Depois de salvar, cancelar ou apertar Esc. */
  aoFechar: () => void
}

/**
 * O cadastro do fornecedor num diálogo — na lista não há mais coluna lateral para ele.
 *
 * O formulário remonta a cada abertura (a chave), então entrar para editar e sair para cadastrar
 * não deixa valor da vez anterior no campo.
 */
export function DialogoDeFornecedor({ aberto, aoFechar }: Props) {
  const editavel = useEscritaLiberada()
  const fornecedor = aberto ? aberto.fornecedor : undefined

  return (
    <DialogoDeFormulario
      aberto={!!aberto}
      aoFechar={aoFechar}
      titulo={fornecedor ? `Editar ${fornecedor.nome}` : 'Novo fornecedor'}
      descricao="Nome, documento, categoria e contato. O resto do combinado cabe nas observações."
      largura="largo"
    >
      <FormularioDeFornecedor
        key={fornecedor?.id ?? 'novo'}
        editando={fornecedor}
        editavel={editavel}
        aoConcluir={aoFechar}
      />
    </DialogoDeFormulario>
  )
}
