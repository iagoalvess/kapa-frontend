import {
  CalendarDays,
  Clock,
  CreditCard,
  FileText,
  Info,
  type LucideIcon,
  Percent,
  RotateCcw,
  Ticket,
} from 'lucide-react'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import { Selo } from '@/components/Selo'
import { cn } from '@/lib/utils'

/**
 * Os títulos que a instrução da IA permite (`ResumoDoTermoService.Instrucao`), sem acento e em
 * minúsculas. Título fora da lista (ou resumo antigo, sem título) cai no ícone de documento.
 */
const ICONES: Record<string, LucideIcon> = {
  pagamentos: CreditCard,
  desconto: Percent,
  atraso: Clock,
  desistencia: FileText,
  reembolso: RotateCcw,
  prazos: CalendarDays,
  convites: Ticket,
}

interface Topico {
  titulo?: string
  texto: string
}

const semAcento = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/**
 * Cada parágrafo vira um tópico. Com "Título: frase" (o formato da instrução atual), o título ganha
 * ícone e coluna; sem ele (resumos gerados antes), o parágrafo se divide por frase, como era.
 */
function separarTopicos(texto: string): Topico[] {
  // O segmentador preserva números, abreviações e pontuação do conteúdo recebido.
  const segmentador = new Intl.Segmenter('pt-BR', { granularity: 'sentence' })
  return texto.split(/\n\s*\n/).flatMap((paragrafo): Topico[] => {
    const linha = paragrafo.replace(/\s*\n\s*/g, ' ').trim()
    const titulado = /^([\p{L} ]{2,24}):\s+(.+)$/u.exec(linha)
    const [, titulo, frase] = titulado ?? []
    if (titulo && frase) return [{ titulo: titulo.trim(), texto: frase }]
    return Array.from(segmentador.segment(linha), ({ segment }) => ({ texto: segment.trim() })).filter(
      (t) => t.texto,
    )
  })
}

/** O resumo da API em tópicos de leitura, sem interpretar nem reescrever condições do termo. */
export function ResumoDoTermo({
  texto,
  versao,
  versaoAceita,
  className,
}: {
  texto: string | null
  versao?: number
  versaoAceita?: number
  className?: string
}) {
  if (!texto?.trim()) return null

  // A instrução já pede até 4; o corte segura o modelo que desobedece e o resumo antigo, dividido por frase.
  const topicos = separarTopicos(texto).slice(0, 4)
  const assinado = versaoAceita !== undefined
  const outraVersao = assinado && versao !== versaoAceita

  return (
    <section
      aria-label="Resumo do termo por IA"
      className={cn('bg-card shadow-cartao @container overflow-hidden rounded-3xl', className)}
    >
      <div className="grid @2xl:grid-cols-[15rem_minmax(0,1fr)]">
        <header className="from-brand-wash relative flex gap-4 overflow-hidden bg-linear-to-b to-transparent p-5 @2xl:flex-col @2xl:pb-0">
          <div className="grid min-w-0 flex-1 content-start gap-1.5">
            <h2 className="text-foreground text-2xl leading-tight font-semibold text-balance">
              {assinado ? 'O que vale saber do seu termo' : 'Antes de aderir, vale saber'}
            </h2>
            <p className="text-muted-foreground text-sm">
              Kapinha destaca os principais pontos do termo <Selo tom="neutro">IA</Selo>
            </p>
          </div>
          <img
            src={mascoteChecklist}
            alt=""
            aria-hidden
            className="w-20 shrink-0 self-end object-contain @2xl:mt-auto @2xl:w-44 @2xl:self-center"
          />
        </header>

        <div className="grid content-start px-5 py-2">
          {outraVersao ? (
            <p className="bg-brand-wash text-brand-text my-3 rounded-xl px-4 py-3 text-sm">
              Este resumo é da versão {versao}. Você aceitou a versão {versaoAceita}.
            </p>
          ) : null}

          <ul className="divide-y">
            {topicos.map(({ titulo, texto: frase }, indice) => {
              const Icone = (titulo && ICONES[semAcento(titulo)]) || FileText
              return (
                <li
                  key={`${indice}-${frase}`}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-0.5 py-4 @xl:grid-cols-[auto_8rem_minmax(0,1fr)]"
                >
                  <span className="bg-brand-tint text-brand-text row-span-2 inline-flex size-11 items-center justify-center rounded-full @xl:row-span-1">
                    <Icone className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  {titulo ? <strong className="text-foreground font-semibold">{titulo}</strong> : null}
                  <span
                    className={cn('text-foreground text-[15px] leading-relaxed', !titulo && '@xl:col-span-2')}
                  >
                    {frase}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <p className="text-muted-foreground flex items-start gap-2 border-t px-5 py-4 text-xs leading-relaxed">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Gerado por IA{versao ? ` a partir da versão ${versao}` : ''}. Pode conter erros. O que vale é o texto
        completo do termo, logo abaixo.
      </p>
    </section>
  )
}
