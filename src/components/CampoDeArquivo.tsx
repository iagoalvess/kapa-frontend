import { Upload } from 'lucide-react'
import { type DragEvent, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  /** O arquivo escolhido, se houver. */
  valor: File | undefined
  /** Chamado com o arquivo, ou `undefined` ao desistir. */
  aoEscolher: (arquivo: File | undefined) => void
  /** O `accept` do `<input>` — só filtra a janela do sistema; quem confere é a API. */
  tipos: string
  /** Nome do campo para o leitor de tela e texto de chamada ("Anexar o arquivo"). */
  rotulo: string
  /** A linha cinza embaixo: o que pode ser enviado ("PDF ou imagem."). */
  dica: string
  desabilitado?: boolean
}

/**
 * O anexo como área de soltar — o retângulo tracejado do padrão de mercado, no lugar da pílula.
 *
 * O retângulo é um `<button>`: clicar abre o seletor de arquivos, e arrastar um arquivo para cima
 * acende a borda e o solta no campo. O `<input type="file">` fica escondido, com o `aria-label` que
 * é o nome do campo — é ele que o leitor de tela anuncia ao focar. Escolhido, o nome do arquivo toma
 * o lugar da chamada, e "Remover" limpa a escolha.
 *
 * @param rotulo Vai no `aria-label` do campo — o nome que o leitor de tela anuncia, e o texto de
 *   chamada do retângulo enquanto não há arquivo.
 */
export function CampoDeArquivo({ valor, aoEscolher, tipos, rotulo, dica, desabilitado = false }: Props) {
  const entrada = useRef<HTMLInputElement>(null)
  const [arrastando, definirArrastando] = useState(false)

  const soltar = (evento: DragEvent<HTMLButtonElement>) => {
    evento.preventDefault()
    definirArrastando(false)
    if (desabilitado) return

    const arquivo = evento.dataTransfer.files?.[0]
    if (arquivo) aoEscolher(arquivo)
  }

  // Sem o teste do `relatedTarget`, cruzar o ícone ou o texto dentro do botão pisca o destaque.
  const saiu = (evento: DragEvent<HTMLButtonElement>) => {
    if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) definirArrastando(false)
  }

  return (
    <div className="grid min-w-0 gap-1">
      <input
        ref={entrada}
        type="file"
        accept={tipos}
        aria-label={rotulo}
        tabIndex={-1}
        className="sr-only"
        disabled={desabilitado}
        onChange={(evento) => aoEscolher(evento.target.files?.[0])}
      />
      <button
        type="button"
        disabled={desabilitado}
        onClick={() => entrada.current?.click()}
        onDragOver={(evento) => {
          evento.preventDefault()
          if (!desabilitado) definirArrastando(true)
        }}
        onDragLeave={saiu}
        onDrop={soltar}
        className={cn(
          'border-border focus-visible:ring-ring hover:border-brand-border flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed px-4 py-5 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none',
          arrastando && 'border-brand bg-brand-wash',
          desabilitado && 'pointer-events-none opacity-50',
        )}
      >
        <Upload
          className={cn('size-6', arrastando ? 'text-brand-text' : 'text-muted-foreground')}
          aria-hidden
        />
        <span
          className={cn(
            'max-w-full min-w-0 truncate text-sm font-medium',
            arrastando ? 'text-brand-text' : 'text-foreground',
          )}
        >
          {valor ? valor.name : rotulo}
        </span>
        <span className="text-texto-muted text-xs">
          {arrastando
            ? 'Solte o arquivo aqui.'
            : valor
              ? 'Clique para trocar o arquivo.'
              : 'Arraste e solte, ou clique para escolher.'}
        </span>
      </button>
      <div className="flex items-center justify-between gap-2">
        <p className="text-texto-muted text-xs">{dica}</p>
        {valor ? (
          <button
            type="button"
            disabled={desabilitado}
            onClick={() => aoEscolher(undefined)}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded text-xs underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
          >
            Remover
          </button>
        ) : null}
      </div>
    </div>
  )
}
