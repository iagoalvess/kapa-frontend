import { type ReactNode, useEffect, useId, useState } from 'react'

/**
 * Troca de slide 6s depois da última troca; para se o usuário pediu menos animação.
 *
 * Um timer por slide, e não um `setInterval` fixo: com o intervalo, clicar num indicador perto
 * do fim do ciclo trocava o slide escolhido logo em seguida.
 */
function useCarrossel(total: number) {
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const id = setTimeout(() => setIndice((indice + 1) % total), 6000)
    return () => clearTimeout(id)
  }, [indice, total])

  return [indice, setIndice] as const
}

/** Um destaque do passaporte: mensagem, retrato do mascote e uma cena ilustrativa. */
export interface Slide {
  Cena: () => ReactNode
  mascote: string
  titulo: string
  tituloDaCena: string
  frase: string
}

/**
 * Passaporte compartilhado pelas telas de conta e de formatura. Cada conjunto fornece só
 * o conteúdo; proporções, recorte do ingresso, retrato e navegação seguem a mesma estrutura.
 */
export function Carrossel({ slides }: { slides: readonly Slide[] }) {
  const id = useId()
  const [slide, setSlide] = useCarrossel(slides.length)
  const atual = slides[slide]
  if (!atual) return null
  const { Cena, mascote, titulo, tituloDaCena, frase } = atual

  return (
    <section
      className="carrossel-passaporte w-full max-w-140"
      aria-label="Conheça o Kapa"
      aria-roledescription="carrossel"
    >
      <h2
        key={`${slide}-titulo`}
        className="carrossel-passaporte-titulo motion-safe:animate-entrar min-h-[2.2em] text-left font-extrabold tracking-[-0.04em] whitespace-pre-line"
      >
        {titulo}
      </h2>
      {/* `key` remonta a cena na troca, e as animações recomeçam do zero em vez de pegar no meio. */}
      <div
        id={`${id}-cena`}
        key={slide}
        className="carrossel-passaporte-ingresso motion-safe:animate-entrar mt-7"
        aria-hidden="true"
      >
        <div className="carrossel-passaporte-recorte bg-brand-wash text-foreground relative grid min-h-80 grid-cols-[32%_minmax(0,1fr)] overflow-hidden rounded-3xl">
          <div className="flex items-center justify-center px-3 py-6">
            <div className="bg-brand-tint relative aspect-square w-full overflow-hidden rounded-full">
              <img
                src={mascote}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              />
            </div>
          </div>
          <div className="carrossel-passaporte-conteudo flex min-w-0 flex-col gap-4 px-5 py-7">
            <div>
              <div className="text-brand-text flex items-center justify-between gap-2">
                <p className="text-[9px] font-semibold tracking-[0.18em]">KAPA · SUA TURMA</p>
                <span className="shrink-0 text-xs font-semibold tabular-nums">
                  {String(slide + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}
                </span>
              </div>
              <h3 className="carrossel-passaporte-chamada mt-3 min-h-[2.3em] font-extrabold tracking-[-0.03em] whitespace-pre-line">
                {tituloDaCena}
              </h3>
            </div>
            <div className="min-h-32">
              <Cena />
            </div>
          </div>
          <span className="carrossel-passaporte-picote pointer-events-none absolute left-[32%] -translate-x-1/2" />
        </div>
      </div>
      <p className="mt-6 min-h-[3.25em] px-3 text-center text-[15px] leading-relaxed font-medium text-pretty">
        {frase}
      </p>
      <fieldset className="mt-4 flex justify-center gap-1" aria-label="Destaques">
        {slides.map((item, i) => (
          <button
            key={item.frase}
            type="button"
            aria-current={i === slide ? 'true' : undefined}
            aria-controls={`${id}-cena`}
            aria-label={`Destaque ${i + 1}: ${item.tituloDaCena.replaceAll('\n', ' ')}`}
            onClick={() => setSlide(i)}
            className="focus-visible:outline-on-brand group grid size-8 place-items-center rounded-full outline-offset-2"
          >
            <span
              className={`size-2.5 rounded-full transition-colors ${i === slide ? 'bg-on-brand' : 'bg-on-brand/35 group-hover:bg-on-brand/70'}`}
            />
          </button>
        ))}
      </fieldset>
    </section>
  )
}
