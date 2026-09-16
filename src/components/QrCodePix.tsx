import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { encode } from 'uqr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * O QR Code de um PIX e o copia-e-cola ao lado, com o botão de copiar.
 *
 * Desenhado aqui, no navegador, a partir do texto que a API devolve: nunca por serviço externo de QR
 * — código PIX passando por servidor de terceiro é o código no log de terceiro. SVG em data URI, e não
 * canvas: escala sem borrar, não sai da página e é o mesmo no teste e na tela.
 *
 * Mora em `components/` porque a tela do PIX de teste (Sprint 8) e a da parcela (Sprint 9) o usam.
 *
 * @param copiaECola O BR Code, como a API devolveu.
 * @param destaque O jeito do celular: o botão de copiar grande, acima do QR — no celular ninguém
 *   fotografa a própria tela. O código fica visível embaixo, para copiar à mão se o navegador negar.
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
  // Correção M (15%): o padrão de mercado para PIX — lê bem em tela de celular com reflexo.
  const { data, size } = encode(copiaECola, { ecc: 'M', border: 2 })
  const modulos = data.flatMap((linha, y) =>
    linha.flatMap((escuro, x) => (escuro ? [`M${x} ${y}h1v1h-1z`] : [])),
  )
  // Preto puro, e não token: leitor de QR precisa do contraste máximo, seja qual for a paleta.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><path fill="#000" d="${modulos.join('')}"/></svg>`

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(copiaECola)
      toast.success('Código PIX copiado.')
    } catch {
      toast.warning('Não deu para copiar. Selecione o código e copie manualmente.')
    }
  }

  const codigo = (
    <Input
      readOnly
      value={copiaECola}
      aria-label="PIX copia e cola"
      className="font-mono text-xs"
      onFocus={(evento) => evento.currentTarget.select()}
    />
  )

  return (
    <div className={cn('grid justify-items-center gap-4', className)}>
      {destaque ? (
        <Button type="button" size="lg" className="w-full" onClick={copiar}>
          <Copy aria-hidden />
          Copiar código PIX
        </Button>
      ) : null}
      <img
        src={`data:image/svg+xml,${encodeURIComponent(svg)}`}
        alt="QR Code do PIX"
        className="bg-card aspect-square w-full max-w-56 rounded-xl border p-2"
      />
      {destaque ? (
        codigo
      ) : (
        <div className="flex w-full gap-2">
          {codigo}
          <Button type="button" variant="outline" onClick={copiar}>
            <Copy aria-hidden />
            Copiar
          </Button>
        </div>
      )}
    </div>
  )
}
