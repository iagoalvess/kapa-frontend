import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Largura máxima a partir do `sm`: um campo por linha, ou o formulário em duas colunas. */
const LARGURAS = {
  estreito: 'sm:max-w-lg',
  medio: 'sm:max-w-xl',
  largo: 'sm:max-w-2xl',
} as const

/**
 * O rodapé (`AcoesDoFormulario`) fica preso no pé da área que rola, com o fundo do cartão por baixo: "Salvar" à
 * vista no formulário que passa da tela. O espaço de baixo do diálogo passa a ser dele — padding no corpo deixaria
 * o conteúdo rolando por baixo do rodapé.
 */
const RODAPE_FIXO =
  'has-data-[slot=acoes-do-formulario]:pb-0 **:data-[slot=acoes-do-formulario]:bg-card **:data-[slot=acoes-do-formulario]:sticky **:data-[slot=acoes-do-formulario]:bottom-0 **:data-[slot=acoes-do-formulario]:z-10 **:data-[slot=acoes-do-formulario]:-mt-3 **:data-[slot=acoes-do-formulario]:pt-3 **:data-[slot=acoes-do-formulario]:pb-5 sm:**:data-[slot=acoes-do-formulario]:pb-8'

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
 * plano, pagamento, baixa, recusa, estorno, senha: cartão branco arredondado, título e descrição
 * fixos em cima, o formulário rolando embaixo deles com o rodapé preso no pé.
 *
 * Controlado: quem usa guarda o aberto e passa o botão que abre por fora. O conteúdo só monta com o
 * diálogo aberto: formulário que nasce dentro dele recomeça a cada abertura; o que vive fora (o
 * `useForm` no mesmo componente do botão) se reinicia no clique que abre.
 *
 * Monta as peças do `AlertDialog` à mão porque o dele não fecha no clique fora — de propósito, para a
 * confirmação. Aqui o fundo é o "Cancelar": `onClick`, e não `pointerdown`, para que selecionar texto
 * arrastando até fora do cartão não descarte o formulário.
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
    <AlertDialogPrimitive.Root open={aberto} onOpenChange={(estaAberto) => (estaAberto ? null : aoFechar())}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          onClick={aoFechar}
          className="bg-foreground/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50"
        />
        <AlertDialogPrimitive.Content
          className={cn(
            'bg-card data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border shadow-lg sm:max-h-[90dvh] sm:rounded-3xl',
            LARGURAS[largura],
          )}
        >
          <div className="grid gap-1.5 px-5 pt-5 pb-4 sm:px-8 sm:pt-8">
            <AlertDialogPrimitive.Title className="text-lg font-semibold">
              {titulo}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-muted-foreground text-sm">
              {descricao}
            </AlertDialogPrimitive.Description>
          </div>
          <div
            className={cn(
              'rolagem-discreta min-h-0 overflow-y-auto overscroll-contain px-5 pt-1 pb-5 sm:px-8 sm:pb-8',
              RODAPE_FIXO,
            )}
          >
            {aberto ? children : null}
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}
