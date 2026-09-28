import { encode } from 'uqr'
import { cn } from '@/lib/utils'

/**
 * Um QR Code desenhado no navegador, como SVG em data URI.
 *
 * Nunca por serviço externo: o conteúdo (um PIX, o link de um convite) passando por servidor de
 * terceiro é o conteúdo no log de terceiro. SVG, e não canvas: escala sem borrar e é o mesmo no
 * teste e na tela. Preto puro sobre branco, e não token — leitor de QR precisa do contraste máximo,
 * seja qual for a paleta.
 *
 * Subiu de `QrCodePix` quando o convite da festa (Sprint 21) passou a precisar do mesmo desenho.
 *
 * @param conteudo O texto do QR.
 * @param rotulo O texto alternativo da imagem.
 */
export function QrCode({
  conteudo,
  rotulo,
  className,
}: {
  conteudo: string
  rotulo: string
  className?: string
}) {
  // Correção M (15%): lê bem em tela de celular com reflexo e em papel dobrado.
  const { data, size } = encode(conteudo, { ecc: 'M', border: 2 })
  const modulos = data.flatMap((linha, y) =>
    linha.flatMap((escuro, x) => (escuro ? [`M${x} ${y}h1v1h-1z`] : [])),
  )
  // A única cor literal fora do index.css, de propósito: o SVG vira `<img>` por data URI, onde o CSS
  // da página não chega, e o QR precisa do preto sobre branco puro para qualquer leitor ler.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path fill="#000" d="${modulos.join('')}"/></svg>`

  return (
    <img
      src={`data:image/svg+xml,${encodeURIComponent(svg)}`}
      alt={rotulo}
      className={cn('bg-card aspect-square w-full rounded-xl border p-2', className)}
    />
  )
}
