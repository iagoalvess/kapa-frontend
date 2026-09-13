import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { encode } from 'uqr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * O link recém-criado: copiar e QR para projetar em assembleia.
 *
 * Aparece uma vez só — o banco guarda o hash, e reexibir exigiria guardar o token puro, o que
 * anularia o hash. Por isso o aviso.
 *
 * O QR é gerado aqui mesmo (`uqr`, sem dependências). Passar o link por um serviço de QR de
 * terceiro deixaria o link inteiro no log dele.
 */
export function LinkDaTurma({ link }: { link: string }) {
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Link copiado.')
    } catch {
      toast.error('Não deu para copiar. Selecione o link e copie manualmente.')
    }
  }

  return (
    <div className="border-border motion-safe:animate-entrar grid gap-4 rounded-xl border p-4 sm:grid-cols-[1fr_auto]">
      <div className="grid content-start gap-3">
        <p role="alert" className="text-warning-text bg-warning-bg rounded-lg px-3 py-2 text-sm">
          Copie agora — por segurança, não mostramos o link de novo.
        </p>
        <div className="flex gap-2">
          <Input
            readOnly
            value={link}
            aria-label="Link do convite"
            onFocus={(evento) => evento.currentTarget.select()}
          />
          <Button type="button" variant="outline" onClick={copiar}>
            <Copy aria-hidden />
            Copiar
          </Button>
        </div>
      </div>

      <QrCode valor={link} />
    </div>
  )
}

/** QR como SVG: um quadrado por módulo escuro, na cor do texto, sobre o fundo do cartão. */
function QrCode({ valor }: { valor: string }) {
  const { data, size } = encode(valor, { ecc: 'M', border: 2 })
  const caminho = data
    .flatMap((linha, y) => linha.map((escuro, x) => (escuro ? `M${x} ${y}h1v1h-1z` : '')))
    .join('')

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      aria-label="QR code do link"
      shapeRendering="crispEdges"
      className="bg-card text-foreground size-44 justify-self-center"
    >
      <title>QR code do link</title>
      <path d={caminho} fill="currentColor" />
    </svg>
  )
}
