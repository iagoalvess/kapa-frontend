import { Bold, Heading2, Link2, List, type LucideIcon } from 'lucide-react'
import { type ComponentProps, type Ref, useRef, useState } from 'react'
import { TextoEmMarkdown } from '@/components/TextoEmMarkdown'
import { cn } from '@/lib/utils'

/** Os quatro botões que importam — nada além disso (decisão 2 da Sprint 11). */
export type Formato = 'negrito' | 'lista' | 'link' | 'titulo'

const BOTOES: { formato: Formato; rotulo: string; icone: LucideIcon }[] = [
  { formato: 'negrito', rotulo: 'Negrito', icone: Bold },
  { formato: 'lista', rotulo: 'Lista', icone: List },
  { formato: 'link', rotulo: 'Link', icone: Link2 },
  { formato: 'titulo', rotulo: 'Título de seção', icone: Heading2 },
]

const PREFIXOS = { lista: '- ', titulo: '## ' } as const

const estiloDaAba = (ativa: boolean) =>
  cn(
    'h-8 flex-1 rounded-full text-sm',
    ativa ? 'bg-card text-foreground shadow-xs font-medium' : 'text-muted-foreground',
  )

/**
 * Aplica um formato ao trecho selecionado e diz o que deve ficar selecionado depois.
 *
 * Negrito e link envolvem a seleção — sem seleção, entram com um texto de exemplo já selecionado,
 * pronto para ser digitado por cima; no link, o que fica selecionado é o endereço. Lista e título
 * valem por linha: cada linha tocada pela seleção ganha o prefixo, uma vez só.
 *
 * @param texto O markdown inteiro.
 * @param inicio Começo da seleção.
 * @param fim Fim da seleção.
 * @param formato O botão apertado.
 */
export function aplicarFormato(texto: string, inicio: number, fim: number, formato: Formato) {
  const antes = texto.slice(0, inicio)
  const depois = texto.slice(fim)

  if (formato === 'negrito') {
    const miolo = texto.slice(inicio, fim) || 'texto em negrito'
    return { texto: `${antes}**${miolo}**${depois}`, inicio: inicio + 2, fim: inicio + 2 + miolo.length }
  }

  if (formato === 'link') {
    const miolo = texto.slice(inicio, fim) || 'texto do link'
    const endereco = 'https://'
    const comeco = inicio + miolo.length + 3
    return {
      texto: `${antes}[${miolo}](${endereco})${depois}`,
      inicio: comeco,
      fim: comeco + endereco.length,
    }
  }

  const prefixo = PREFIXOS[formato]
  const linha = texto.lastIndexOf('\n', inicio - 1) + 1
  const trecho = texto
    .slice(linha, fim)
    .split('\n')
    .map((atual) => (atual.startsWith(prefixo) ? atual : prefixo + atual))
    .join('\n')

  return {
    texto: texto.slice(0, linha) + trecho + depois,
    inicio: linha + trecho.length,
    fim: linha + trecho.length,
  }
}

interface Props extends Omit<ComponentProps<'textarea'>, 'value' | 'onChange' | 'ref'> {
  value: string
  /** Recebe o texto novo — do teclado ou de um dos botões. */
  onChange: (valor: string) => void
  /** O `ref` do `react-hook-form`, que ele usa para focar o campo com erro. */
  ref?: Ref<HTMLTextAreaElement>
  /** Título da prévia — quem lê, e onde ("Como a turma vai ler"). */
  rotuloDaPrevia: string
  /**
   * Forma das duas caixas, texto e prévia, sempre iguais — o termo usa a proporção de folha A4 para o
   * que se escreve ter a forma do que vai ser lido. O padrão é uma altura mínima de mural.
   */
  folha?: string
}

/**
 * Markdown à esquerda, prévia à direita; no celular, uma coluna só, com abas.
 *
 * A prévia é o mesmo {@link TextoEmMarkdown} da leitura: o que se vê enquanto escreve é o que o leitor
 * vai ver, com a mesma sanitização. Sem WYSIWYG, sem imagem no meio do texto, sem cor. Serve ao mural
 * (Sprint 11) e ao termo de adesão (Sprint 7).
 *
 * Todas as outras props (`id`, `aria-*`, `name`, `onBlur`) vão para o `<textarea>`, então funciona
 * direto dentro do `FormControl`.
 */
export function EditorDeMarkdown({
  value,
  onChange,
  ref,
  rotuloDaPrevia,
  folha = 'min-h-72',
  className,
  disabled,
  ...campo
}: Props) {
  const [aba, definirAba] = useState<'escrever' | 'previa'>('escrever')
  const textarea = useRef<HTMLTextAreaElement | null>(null)

  const formatar = (formato: Formato) => {
    const alvo = textarea.current
    if (!alvo) return

    const resultado = aplicarFormato(value, alvo.selectionStart, alvo.selectionEnd, formato)
    onChange(resultado.texto)
    // Depois do React escrever o texto novo: antes disso a seleção cairia no texto antigo.
    requestAnimationFrame(() => {
      alvo.focus()
      alvo.setSelectionRange(resultado.inicio, resultado.fim)
    })
  }

  const ligar = (no: HTMLTextAreaElement | null) => {
    textarea.current = no
    if (typeof ref === 'function') ref(no)
    else if (ref) ref.current = no
  }

  return (
    <div className="grid gap-3">
      <div
        role="tablist"
        aria-label="Modo do editor"
        className="bg-muted flex gap-1 rounded-full p-1 lg:hidden"
      >
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'escrever'}
          className={estiloDaAba(aba === 'escrever')}
          onClick={() => definirAba('escrever')}
        >
          Escrever
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'previa'}
          className={estiloDaAba(aba === 'previa')}
          onClick={() => definirAba('previa')}
        >
          Prévia
        </button>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className={cn('min-w-0 gap-2', aba === 'escrever' ? 'grid' : 'hidden lg:grid')}>
          <div role="toolbar" aria-label="Formatação" className="flex gap-1">
            {BOTOES.map(({ formato, rotulo, icone: Icone }) => (
              <button
                key={formato}
                type="button"
                title={rotulo}
                aria-label={rotulo}
                disabled={disabled}
                onClick={() => formatar(formato)}
                className="hover:bg-muted text-foreground/80 focus-visible:ring-ring inline-flex size-9 items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              >
                <Icone className="size-4" aria-hidden />
              </button>
            ))}
          </div>
          <textarea
            {...campo}
            ref={ligar}
            value={value}
            disabled={disabled}
            onChange={(evento) => onChange(evento.target.value)}
            spellCheck
            className={cn(
              'border-input placeholder:text-texto-muted focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-y rounded-xl border bg-transparent px-3 py-2 font-mono text-sm leading-relaxed shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
              folha,
              className,
            )}
          />
        </div>

        <section
          aria-label={rotuloDaPrevia}
          className={cn('min-w-0 content-start gap-2', aba === 'previa' ? 'grid' : 'hidden lg:grid')}
        >
          {/* Mesma altura da barra de botões ao lado: o topo da prévia alinha com o do texto. */}
          <p className="flex h-9 items-center text-sm font-medium">{rotuloDaPrevia}</p>
          <div className={cn('w-full overflow-y-auto rounded-xl border px-5 py-4', folha)}>
            {value.trim() ? (
              <TextoEmMarkdown conteudo={value} />
            ) : (
              <p className="text-texto-muted text-sm">A prévia aparece aqui enquanto você escreve.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
