import type { SVGProps } from 'react'

/**
 * O símbolo do PIX: quatro losangos formando um losango maior.
 *
 * Desenhado aqui, e não do `lucide-react`: a biblioteca não tem o PIX, e o ícone de QR genérico diz
 * "escaneie", não "pague com PIX". Usa `currentColor` e `1em` como os ícones do lucide, então herda
 * a cor e o tamanho do botão onde entra — o `[&_svg]:size-4` do `Button` vale para ele.
 */
export function IconePix(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden {...props}>
      <path d="M12 1.5 16.25 5.75 12 10 7.75 5.75Z" />
      <path d="M18.25 7.75 22.5 12 18.25 16.25 14 12Z" />
      <path d="M12 14 16.25 18.25 12 22.5 7.75 18.25Z" />
      <path d="M5.75 7.75 10 12 5.75 16.25 1.5 12Z" />
    </svg>
  )
}
