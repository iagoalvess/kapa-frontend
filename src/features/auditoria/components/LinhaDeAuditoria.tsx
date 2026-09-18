import { Bot } from 'lucide-react'
import { formatarDataHora } from '@/lib/formato'
import { type LinhaDeAuditoria as Linha, rotuloDoEvento } from '../types/auditoria.types'
import { Campo, DiffDeAlteracao } from './DiffDeAlteracao'

/**
 * Uma entrada da linha do tempo: quando e o quê no cabeçalho, e embaixo quem fez mais o corpo do
 * evento.
 *
 * Tudo aberto, sem acordeão: a tela existe para a assembleia varrer com o olho e achar a linha
 * estranha, e um "ver detalhes" por linha transformaria isso em vinte cliques.
 *
 * **"Quem fez" é um campo rotulado, e não um selo ao lado do título.** Solto lá em cima, o nome não
 * dizia se era de quem fez ou de quem sofreu a operação — e num desligamento os dois aparecem na
 * mesma linha. Aqui ele é a primeira linha da lista, com o rótulo à esquerda como todos os outros.
 *
 * Autor nulo é ação de sistema — a régua da madrugada, o worker que anonimizou no fim do prazo. Ele
 * tem nome próprio em vez de um traço, porque "ninguém fez" e "o sistema fez" são respostas
 * diferentes para a mesma pergunta.
 */
export function LinhaDeAuditoria({ linha }: { linha: Linha }) {
  return (
    <li className="border-border grid gap-2 border-b py-4 last:border-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <time dateTime={linha.ocorrido_em} className="text-muted-foreground text-sm tabular-nums">
          {formatarDataHora(linha.ocorrido_em)}
        </time>
        <span className="text-foreground font-medium">{rotuloDoEvento(linha.nome)}</span>
      </div>

      <dl className="grid gap-2 text-sm">
        <Campo rotulo="Quem fez">
          {linha.autor ?? (
            <span className="inline-flex items-center gap-1.5">
              <Bot className="text-muted-foreground size-4" strokeWidth={1.75} aria-hidden />
              Sistema
            </span>
          )}
        </Campo>
      </dl>

      <DiffDeAlteracao dados={linha.dados} pessoas={linha.pessoas} />
    </li>
  )
}
