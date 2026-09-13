import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Estilo de cada elemento do markdown, pelos tokens do tema.
 *
 * Link sempre em nova aba: o documento é aberto a partir do cadastro, e sair da aba levaria o
 * formulário junto.
 */
const componentes: Components = {
  h1: ({ children }) => (
    <h1 className="text-foreground text-2xl font-extrabold tracking-[-0.02em]">{children}</h1>
  ),
  h2: ({ children }) => <h2 className="text-foreground mt-8 text-lg font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="text-foreground mt-6 font-semibold">{children}</h3>,
  p: ({ children }) => <p className="mt-3">{children}</p>,
  ul: ({ children }) => <ul className="mt-3 list-disc space-y-1.5 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1.5 pl-5">{children}</ol>,
  strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-hover hover:text-brand-border font-medium underline underline-offset-2"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="text-foreground border-b px-3 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border-b px-3 py-2 align-top">{children}</td>,
}

/**
 * Texto de um documento legal, renderizado do markdown versionado no backend.
 *
 * `react-markdown` com GFM (tabelas, listas de tarefa, links automáticos). HTML embutido no texto
 * **não** é interpretado — o conteúdo vira nó do React, sem `dangerouslySetInnerHTML`.
 *
 * @param conteudo Markdown do documento.
 */
export function DocumentoLegal({ conteudo }: { conteudo: string }) {
  return (
    <article className="text-muted-foreground text-[15px] leading-relaxed">
      <Markdown remarkPlugins={[remarkGfm]} components={componentes}>
        {conteudo}
      </Markdown>
    </article>
  )
}
