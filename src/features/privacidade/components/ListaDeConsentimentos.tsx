import { Undo2 } from 'lucide-react'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { DOCUMENTOS } from '@/config/legal'
import { formatarDataHora } from '@/lib/formato'
import type { ConsentimentoDoUsuario } from '@/types/legal'

/**
 * O histórico de consentimento, do mais recente — e o botão de revogar na linha que ainda vale.
 *
 * O registro é *append-only*: revogar não apaga o aceite, grava uma linha nova. É por isso que a
 * lista mostra aceite e revogação lado a lado em vez de só o estado atual — a prova é a sequência,
 * e esconder metade dela transformaria a tela num resumo do que aconteceu.
 *
 * Só a **última linha de cada documento**, e só se for um aceite, oferece revogar: revogar duas
 * vezes o mesmo aceite não significa nada, e a API recusa.
 *
 * @param consentimentos Histórico como a API o devolve, do mais recente para o mais antigo.
 * @param aoRevogar Chamado com o id do registro.
 * @param revogando O id em andamento, para travar só aquele botão.
 */
export function ListaDeConsentimentos({
  consentimentos,
  aoRevogar,
  revogando,
}: {
  consentimentos: ConsentimentoDoUsuario[]
  aoRevogar: (id: string) => void
  revogando?: string
}) {
  const vigentes = new Set(
    // A lista já vem do mais recente: a primeira ocorrência de cada documento é a que vale hoje.
    consentimentos
      .filter(
        (consentimento, indice) =>
          consentimentos.findIndex((outro) => outro.tipo === consentimento.tipo) === indice &&
          !consentimento.revogado,
      )
      .map((consentimento) => consentimento.id),
  )

  if (consentimentos.length === 0)
    return <p className="text-muted-foreground text-[15px]">Nenhum registro de consentimento.</p>

  return (
    <ul className="grid gap-4 text-[15px]">
      {consentimentos.map((consentimento) => (
        <li
          key={consentimento.id}
          className="border-border flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b pb-4 last:border-0 last:pb-0"
        >
          <div className="grid min-w-0 gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-foreground font-medium">{DOCUMENTOS[consentimento.tipo].rotulo}</span>
              <Selo tom={consentimento.revogado ? 'perigo' : 'sucesso'}>
                {consentimento.revogado ? 'Revogado' : 'Aceito'}
              </Selo>
            </div>
            {/* Versão e data na mesma linha miúda: as duas respondem "qual texto valia naquele dia",
                e é uma pergunta só. Soltas, a data ia para a quina direita e o botão caía abaixo. */}
            <span className="text-texto-muted text-sm tabular-nums">
              versão {consentimento.versao} · {formatarDataHora(consentimento.aceito_em)}
            </span>
          </div>
          {vigentes.has(consentimento.id) ? (
            <Button
              size="sm"
              variant="outline"
              disabled={revogando === consentimento.id}
              onClick={() => aoRevogar(consentimento.id)}
            >
              <Undo2 aria-hidden />
              Revogar
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
