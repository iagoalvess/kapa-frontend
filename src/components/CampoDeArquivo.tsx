import { Paperclip } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  /** O arquivo escolhido, se houver. */
  valor: File | undefined
  /** Chamado com o arquivo, ou `undefined` ao desistir. */
  aoEscolher: (arquivo: File | undefined) => void
  /** O `accept` do `<input>` — só filtra a janela do sistema; quem confere é a API. */
  tipos: string
  /** O texto da pílula enquanto nada foi escolhido ("Anexar comprovante (opcional)"). */
  rotulo: string
  /** A linha cinza embaixo: o que pode ser enviado ("PDF ou imagem."). */
  dica: string
  desabilitado?: boolean
}

/**
 * Um anexo em pílula, no lugar do botão cru do navegador — como o envio da foto.
 *
 * O `<input type="file">` fica escondido mas acessível: o rótulo é o que se clica, e o foco do
 * teclado acende a pílula. O nome do arquivo escolhido toma o lugar do rótulo.
 */
export function CampoDeArquivo({ valor, aoEscolher, tipos, rotulo, dica, desabilitado = false }: Props) {
  const id = useId()

  return (
    // Coluna flexível, e não grade: numa grade de uma trilha só, a trilha cresce até o nome inteiro do
    // arquivo (texto sem quebra) e empurra o campo para fora do diálogo. Aqui o rótulo encolhe e corta.
    <div className="flex min-w-0 flex-col items-start gap-1">
      <input
        id={id}
        type="file"
        accept={tipos}
        className="peer sr-only"
        disabled={desabilitado}
        onChange={(evento) => aoEscolher(evento.target.files?.[0])}
      />
      <label
        htmlFor={id}
        className={cn(
          'border-border hover:bg-muted peer-focus-visible:ring-ring inline-flex h-8 w-fit max-w-full cursor-pointer items-center gap-2 rounded-full border px-3 text-sm peer-focus-visible:ring-2',
          desabilitado && 'pointer-events-none opacity-50',
        )}
      >
        <Paperclip className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 truncate">{valor ? valor.name : rotulo}</span>
      </label>
      <p className="text-texto-muted text-xs">{dica}</p>
    </div>
  )
}
