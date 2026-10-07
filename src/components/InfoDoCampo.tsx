import { Info } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { FormLabel } from '@/components/ui/form'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * O "i" ao lado do rótulo que mostra a explicação do campo no tooltip do sistema — no lugar do parágrafo
 * cinza embaixo dele, que enchia o diálogo de texto e desalinhava a grade (um campo com três linhas de
 * ajuda ao lado de um sem nenhuma).
 *
 * Abre como a `Dica`: no hover e no foco do teclado. O clique também abre, porque no toque não há hover e
 * a explicação do campo é justamente o que quem está no celular precisa ler; o Radix ignora o toque como
 * hover, então sem isto o "i" não fazia nada ali. Toque fora ou Esc fecham.
 *
 * A margem negativa tira do rótulo a altura que o botão somaria: com ela, o campo com "i" fica na mesma linha do
 * vizinho sem "i".
 *
 * Fica **fora** do `<label>`: dentro, o texto do botão entraria no nome acessível do campo.
 *
 * Use para o que explica o campo e não muda. Texto que muda com o que se digita ("Alcança 12 formandos")
 * continua à vista, embaixo do campo.
 *
 * @param sobre O nome do campo, para o leitor de tela: "Mais sobre Último vencimento".
 * @param children A explicação.
 */
export function InfoDoCampo({ sobre, children }: { sobre: string; children: ReactNode }) {
  const [aberto, definirAberto] = useState(false)

  return (
    <Tooltip open={aberto} onOpenChange={definirAberto}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`Mais sobre ${sobre}`}
          // `preventDefault` desliga o "clique fecha" do Radix, que no toque fecharia o que acabou de abrir.
          onClick={(evento) => {
            evento.preventDefault()
            definirAberto(true)
          }}
          className="text-texto-muted hover:text-brand-text focus-visible:ring-ring -my-1 grid size-5 shrink-0 cursor-pointer place-items-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
        >
          <Info className="size-4" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-pretty">{children}</TooltipContent>
    </Tooltip>
  )
}

/**
 * O rótulo de um `FormField` com o {@link InfoDoCampo} ao lado e, se for o caso, a marca de opcional — que
 * antes abria o parágrafo de ajuda ("Opcional. …") e agora fica à vista sem ele.
 *
 * @param children O texto do rótulo.
 * @param info A explicação do campo; ausente, só o rótulo.
 * @param opcional Mostra "(opcional)" ao lado do nome.
 */
export function RotuloComInfo({
  children,
  info,
  opcional = false,
}: {
  children: string
  info?: ReactNode
  opcional?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <FormLabel>
        {children}
        {opcional ? <span className="text-texto-muted font-normal"> (opcional)</span> : null}
      </FormLabel>
      {info ? <InfoDoCampo sobre={children}>{info}</InfoDoCampo> : null}
    </div>
  )
}
