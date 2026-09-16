import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Props {
  /** A pergunta: "Excluir X?", "Colocar em vigor?". */
  titulo: ReactNode
  /** O que acontece ao confirmar, e o que não dá para desfazer. */
  descricao: ReactNode
  /** O botão que abre. Ausente, quem usa controla por `aberto` — a confirmação que nasce de um envio. */
  gatilho?: ReactNode
  /** Só no modo controlado, junto de `aoFechar`. */
  aberto?: boolean
  /** Esc, clique fora ou o botão que desiste. */
  aoFechar?: () => void
  /** O rótulo do botão que confirma — o verbo é a informação ("Excluir", "Publicar"). */
  rotulo: string
  /** O rótulo do que desiste. "Cancelar", salvo onde "Revisar" ou "Voltar" diz melhor. */
  rotuloDeCancelar?: string
  /** Vermelho no botão que confirma: o que apaga, encerra ou remove. */
  destrutivo?: boolean
  aoConfirmar: () => void
  /** Um parágrafo a mais entre a descrição e os botões — a ressalva que não cabe na descrição. */
  children?: ReactNode
}

/**
 * A confirmação de uma frase de todo o app — excluir, encerrar, publicar, colocar em vigor, gerar
 * link novo: título, o que acontece, e os dois botões no pé.
 *
 * O botão que desiste sempre à esquerda e o que confirma à direita, na mesma ordem em toda tela:
 * quem clica "Excluir" duas vezes por dia não relê os botões.
 *
 * Formulário dentro do diálogo não é confirmação: esse é o `DialogoDeFormulario`.
 */
export function DialogoDeConfirmacao({
  titulo,
  descricao,
  gatilho,
  aberto,
  aoFechar,
  rotulo,
  rotuloDeCancelar = 'Cancelar',
  destrutivo = false,
  aoConfirmar,
  children,
}: Props) {
  // Com gatilho o Radix guarda o aberto sozinho; sem ele, quem usa guarda.
  const controle =
    aberto === undefined
      ? {}
      : { open: aberto, onOpenChange: (estaAberto: boolean) => (estaAberto ? null : aoFechar?.()) }

  return (
    <AlertDialog {...controle}>
      {gatilho ? <AlertDialogTrigger asChild>{gatilho}</AlertDialogTrigger> : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>{rotuloDeCancelar}</AlertDialogCancel>
          <AlertDialogAction variant={destrutivo ? 'destructive' : undefined} onClick={aoConfirmar}>
            {rotulo}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
