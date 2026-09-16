import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

/** Largura máxima a partir do `sm`: um campo por linha, ou o formulário em duas colunas. */
const LARGURAS = {
  estreito: 'data-[size=default]:sm:max-w-lg',
  medio: 'data-[size=default]:sm:max-w-xl',
  largo: 'data-[size=default]:sm:max-w-2xl',
} as const

interface Props {
  aberto: boolean
  /** Fechar: Esc, clique fora, ou o "Cancelar" do formulário. */
  aoFechar: () => void
  titulo: ReactNode
  /** Uma linha sobre o que o formulário faz. Obrigatória: é ela que o leitor de tela anuncia com o título. */
  descricao: ReactNode
  largura?: keyof typeof LARGURAS
  /** O formulário, com o `AcoesDoFormulario` no pé. */
  children: ReactNode
}

/**
 * A casca de todo diálogo de formulário do app — fornecedor, despesa, documento, regras e item do
 * plano, pagamento, baixa, recusa, estorno, senha: cartão branco arredondado, título e descrição em
 * cima, rolagem própria quando o formulário passa da tela.
 *
 * Controlado: quem usa guarda o aberto e passa o botão que abre por fora. O conteúdo só monta com o
 * diálogo aberto: formulário que nasce dentro dele recomeça a cada abertura; o que vive fora (o
 * `useForm` no mesmo componente do botão) se reinicia no clique que abre.
 *
 * Confirmação de uma frase ("Excluir X?") não é formulário: segue no `AlertDialog` direto.
 */
export function DialogoDeFormulario({
  aberto,
  aoFechar,
  titulo,
  descricao,
  largura = 'medio',
  children,
}: Props) {
  return (
    <AlertDialog open={aberto} onOpenChange={(estaAberto) => (estaAberto ? null : aoFechar())}>
      <AlertDialogContent
        className={cn('bg-card grid max-h-[90dvh] gap-5 overflow-y-auto rounded-3xl p-8', LARGURAS[largura])}
      >
        <div className="grid gap-1.5">
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </div>
        {aberto ? children : null}
      </AlertDialogContent>
    </AlertDialog>
  )
}
