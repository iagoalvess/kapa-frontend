import { Download, File, FileImage, FileSpreadsheet, FileText, type LucideIcon } from 'lucide-react'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { formatarDataHora, formatarDataRelativa, formatarTamanho } from '@/lib/formato'
import { useAbrirDocumento } from '../hooks/useDocumentos'
import {
  type Documento,
  ROTULOS_DE_CATEGORIA,
  type TipoDeArquivo,
  tipoDoArquivo,
} from '../types/comunicacao.types'

/** O desenho do arquivo na linha, pelo tipo; o que o acervo não conhece leva o genérico. */
const ICONES = {
  pdf: FileText,
  imagem: FileImage,
  planilha: FileSpreadsheet,
  word: FileText,
} as const satisfies Record<TipoDeArquivo, LucideIcon>

/**
 * Um documento adicionado ao acervo, numa linha do histórico: o que é, a categoria, o arquivo, o
 * tamanho, a versão, quem adicionou e quando — e o botão de baixar. Consulta: corrigir e excluir moram
 * no quadro de Documentos.
 */
export function LinhaDeDocumento({ documento }: { documento: Documento }) {
  const { abrir, abrindo } = useAbrirDocumento()
  const tipo = tipoDoArquivo(documento.content_type)
  const Icone = tipo ? ICONES[tipo] : File

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <span className="bg-muted text-foreground/70 inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
        <Icone className="size-5" strokeWidth={1.75} aria-hidden />
      </span>

      <div className="grid min-w-0 flex-1 basis-52 gap-0.5">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-foreground font-medium break-words">{documento.titulo}</span>
          <Selo tom="marca">{ROTULOS_DE_CATEGORIA[documento.categoria]}</Selo>
          {documento.visibilidade === 'SomenteComissao' ? <Selo tom="cinza">Só comissão</Selo> : null}
        </p>
        <p className="text-muted-foreground text-xs break-all">
          {documento.nome_do_arquivo} · {formatarTamanho(documento.tamanho)}
          {documento.versao > 1 ? ` · versão ${documento.versao}` : ''}
        </p>
        <p className="text-texto-muted text-xs">
          {documento.enviado_por ?? 'Comissão'},{' '}
          <time dateTime={documento.enviado_em} title={formatarDataHora(documento.enviado_em)}>
            {formatarDataRelativa(documento.enviado_em)}
          </time>
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={abrindo}
        onClick={() => abrir(documento)}
        aria-label={`Baixar ${documento.titulo}`}
      >
        <Download aria-hidden />
        Baixar
      </Button>
    </li>
  )
}
