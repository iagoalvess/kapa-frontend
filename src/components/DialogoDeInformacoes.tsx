import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

/** Consulta contextual: mantém a lista no lugar e devolve o foco ao botão ao fechar. */
export function DialogoDeInformacoes({
  gatilho,
  titulo,
  descricao,
  children,
}: {
  gatilho: ReactNode
  titulo: string
  descricao: string
  children: ReactNode
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{gatilho}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-foreground/50 fixed inset-0 z-50" />
        <Dialog.Content className="bg-card fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto overscroll-contain rounded-2xl border p-5 shadow-lg sm:rounded-3xl sm:p-8">
          <div className="bg-card sticky top-0 z-10 flex items-start gap-3 pb-3">
            <div className="grid min-w-0 flex-1 gap-1.5">
              <Dialog.Title className="text-lg font-semibold">{titulo}</Dialog.Title>
              <Dialog.Description className="text-muted-foreground text-sm">{descricao}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 shrink-0"
                aria-label="Fechar informações"
              >
                <X className="size-5" aria-hidden />
              </Button>
            </Dialog.Close>
          </div>
          <div className="grid min-w-0 gap-4">{children}</div>
          <Dialog.Close asChild>
            <Button variant="outline" className="w-full">
              Fechar
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
