import { Copy } from 'lucide-react'
import { useId } from 'react'
import { toast } from 'sonner'
import { QrCode } from '@/components/QrCode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { copiar } from '@/lib/copiar'

/**
 * O QR Code de um PIX e o copia-e-cola ao lado, com o botão de copiar.
 *
 * O QR é o `QrCode` de `components/`, desenhado no navegador a partir do texto que a API devolve.
 *
 * Mora em `components/` porque a tela do PIX de teste (Sprint 8) e a da parcela (Sprint 9) o usam.
 *
 * @param copiaECola O BR Code, como a API devolveu.
 * @param destaque O jeito do celular: copiar primeiro, num bloco só para isso, e o QR embaixo do
 *   traço — no celular ninguém fotografa a própria tela. A chave fica visível, para copiar à mão se
 *   o navegador negar.
 */
export function QrCodePix({
  copiaECola,
  destaque = false,
  className,
}: {
  copiaECola: string
  destaque?: boolean
  className?: string
}) {
  const campo = useId()
  const copiarChave = async () => {
    if (await copiar(copiaECola)) toast.success('Chave PIX copiada.')
    else toast.warning('Não deu para copiar. Selecione a chave e copie manualmente.')
  }

  const codigo = (
    <Input
      readOnly
      id={destaque ? campo : undefined}
      value={copiaECola}
      aria-label={destaque ? undefined : 'Chave PIX'}
      className="bg-card font-mono text-xs"
      onFocus={(evento) => evento.currentTarget.select()}
    />
  )

  const qr = <QrCode conteudo={copiaECola} rotulo="QR Code do PIX" className="max-w-56" />

  if (destaque)
    return (
      <div className={cn('grid gap-5', className)}>
        {/* Copiar é o caminho principal: bloco próprio, com a chave à vista e o botão do lado. */}
        <div className="bg-muted grid gap-2 rounded-2xl p-4">
          <Label htmlFor={campo} className="text-muted-foreground text-sm font-normal">
            Chave PIX
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            {codigo}
            <Button type="button" size="lg" className="shrink-0" onClick={copiarChave}>
              <Copy aria-hidden />
              Copiar
            </Button>
          </div>
        </div>

        <div className="grid justify-items-center gap-4">
          <p className="text-muted-foreground flex w-full items-center gap-3 text-sm">
            <span className="bg-border h-px flex-1" />
            Ou escaneie o QR Code
            <span className="bg-border h-px flex-1" />
          </p>
          {qr}
        </div>
      </div>
    )

  return (
    <div className={cn('grid justify-items-center gap-4', className)}>
      {qr}
      <div className="flex w-full gap-2">
        {codigo}
        <Button type="button" variant="outline" onClick={copiarChave}>
          <Copy aria-hidden />
          Copiar
        </Button>
      </div>
    </div>
  )
}
