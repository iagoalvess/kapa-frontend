import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { TextoEmMarkdown } from '@/components/TextoEmMarkdown'
import { Button } from '@/components/ui/button'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import type { ItemDaFesta, Proposta } from '@/types/festa'
import { useExcluirProposta } from '../hooks/useEscritaDaFesta'
import { DialogoDeProposta } from './DialogoDeProposta'

interface Props {
  item: ItemDaFesta
  propostas: Proposta[]
  /** Só a Gestão levanta e mexe nas candidatas; o resto da turma lê. */
  ehGestao: boolean
  /** Falso trava as escritas — formatura fora de `Ativa`. */
  editavel: boolean
  /** Só a Tesouraria lança despesa, e é ela quem contrata. */
  podeContratar: boolean
  aoContratar: (proposta: Proposta) => void
}

/**
 * As candidatas de um item "a contratar": os orçamentos que a comissão levantou para comparar.
 *
 * Contratado o item, a escolha já aconteceu, e a lista vira registro — some o "Nova proposta" e as
 * ações, fica o histórico de por que a comissão escolheu aquela.
 *
 * O voto da turma nas propostas saiu em 07/10/2026: quem contrata é a comissão, e opinião da turma é
 * assunto de enquete.
 *
 * "Contratar esta" é o atalho do "Contratar" do item: o lançamento da despesa já abre com o título e
 * o preço da escolhida. O do item continua para quem não usa propostas.
 */
export function Propostas({ item, propostas, ehGestao, editavel, podeContratar, aoContratar }: Props) {
  const [cadastro, definirCadastro] = useState<false | { proposta?: Proposta }>(false)
  const [excluindo, definirExcluindo] = useState<Proposta | false>(false)
  const excluir = useExcluirProposta()
  const aberta = !item.cancelado && item.quantidade_de_despesas === 0

  if (propostas.length === 0 && !(aberta && ehGestao && editavel)) return null

  return (
    <section aria-label="Propostas" className="grid gap-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-foreground font-medium">
          {aberta ? 'Propostas' : 'Propostas levantadas'}
          {propostas.length > 0 ? (
            <span className="text-muted-foreground font-normal"> · {formatarNumero(propostas.length)}</span>
          ) : null}
        </h3>
        {aberta && ehGestao && editavel ? (
          <Button size="sm" variant="outline" onClick={() => definirCadastro({})}>
            <Plus aria-hidden />
            Nova proposta
          </Button>
        ) : null}
      </header>

      {propostas.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhuma ainda. Liste os orçamentos que a comissão levantou para comparar.
        </p>
      ) : (
        <ul className="grid gap-2">
          {propostas.map((proposta) => (
            <li key={proposta.id} className="border-border grid gap-2 rounded-2xl border p-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-foreground min-w-0 flex-1 font-medium break-words">
                  {proposta.titulo}
                </span>
                <span className="text-foreground shrink-0 tabular-nums">
                  {proposta.valor_em_centavos > 0 ? (
                    formatarCentavos(proposta.valor_em_centavos)
                  ) : (
                    <span className="text-texto-muted text-sm font-normal">Sem preço</span>
                  )}
                </span>
              </div>

              {proposta.o_que_inclui ? (
                <TextoEmMarkdown conteudo={proposta.o_que_inclui} variante="resumo" className="text-sm" />
              ) : null}

              {aberta && ehGestao && editavel ? (
                <div className="flex flex-wrap items-center justify-end gap-1">
                  {podeContratar ? (
                    <Button size="sm" onClick={() => aoContratar(proposta)}>
                      Contratar esta
                    </Button>
                  ) : null}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground size-8 rounded-full"
                    onClick={() => definirCadastro({ proposta })}
                    aria-label={`Editar ${proposta.titulo}`}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground size-8 rounded-full"
                    onClick={() => definirExcluindo(proposta)}
                    aria-label={`Excluir ${proposta.titulo}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <DialogoDeProposta itemId={item.id} aberto={cadastro} aoFechar={() => definirCadastro(false)} />

      <DialogoDeConfirmacao
        aberto={excluindo !== false}
        aoFechar={() => definirExcluindo(false)}
        titulo={excluindo ? `Excluir a proposta “${excluindo.titulo}”?` : ''}
        descricao="Nada do caixa muda — proposta não é despesa."
        rotulo="Excluir"
        rotuloDeCancelar="Voltar"
        destrutivo
        aoConfirmar={() => {
          if (!excluindo) return

          const alvo = excluindo.id
          definirExcluindo(false)
          excluir.mutate(alvo, { onSuccess: () => toast.info('Proposta excluída.'), onError: avisarErro })
        }}
      />
    </section>
  )
}
