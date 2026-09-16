import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

/**
 * Estilo de cada elemento do markdown, pelos tokens do tema.
 *
 * Link sempre em nova aba: o texto é aberto a partir de uma tela do app, e sair da aba levaria o
 * que estava nela junto.
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
 * O resumo do cartão: as primeiras linhas, sem hierarquia. Título vira frase em negrito (um `h1`
 * dentro do cartão competiria com o título do aviso) e link vira texto — o cartão inteiro já é
 * clicável, e link dentro de link não se clica.
 */
const componentesDoResumo: Components = {
  ...componentes,
  h1: ({ children }) => <p className="text-foreground font-semibold">{children}</p>,
  h2: ({ children }) => <p className="text-foreground font-semibold">{children}</p>,
  h3: ({ children }) => <p className="text-foreground font-semibold">{children}</p>,
  p: ({ children }) => <p>{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
  a: ({ children }) => <span className="underline underline-offset-2">{children}</span>,
}

/**
 * Markdown vindo do banco renderizado com segurança — **a única função de renderização do app**:
 * documentos legais, termo de adesão, a prévia do editor e a leitura do mural passam todos por
 * aqui. Duas rotas de renderização é como uma delas fica sem sanitização.
 *
 * `react-markdown` com GFM (tabelas, listas de tarefa, links automáticos). HTML embutido no texto
 * **não** é interpretado — `<script>` e `<img onerror>` saem como nada, sem `dangerouslySetInnerHTML`
 * e sem `rehype-raw` —, e o `urlTransform` padrão tira `javascript:` e `data:` dos links.
 *
 * @param conteudo Markdown.
 * @param variante `documento`, o texto inteiro; `resumo`, as primeiras linhas de um cartão, cortadas
 *   em três linhas e sem título nem link.
 */
export function TextoEmMarkdown({
  conteudo,
  variante = 'documento',
  className,
}: {
  conteudo: string
  variante?: 'documento' | 'resumo'
  className?: string
}) {
  const resumo = variante === 'resumo'

  return (
    <article
      className={cn(
        'text-muted-foreground leading-relaxed',
        resumo ? 'line-clamp-3 text-sm' : 'text-[15px]',
        className,
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]} components={resumo ? componentesDoResumo : componentes}>
        {conteudo}
      </Markdown>
    </article>
  )
}
