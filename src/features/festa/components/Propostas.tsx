import { Heart, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { TextoEmMarkdown } from '@/components/TextoEmMarkdown'
import { Button } from '@/components/ui/button'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
import type { ItemDaFesta, Proposta } from '@/types/festa'
import { useDesvotar, useExcluirProposta, useVotar } from '../hooks/useEscritaDaFesta'
import { DialogoDeProposta } from './DialogoDeProposta'

interface Props {
  item: ItemDaFesta
  propostas: Proposta[]
  /** A Gestão levanta as candidatas; qualquer membro vota. */
  ehGestao: boolean
  /** Falso trava as escritas — formatura fora de `Ativa`. */
  editavel: boolean
}

/** Toda falha de escrita deste bloco vira o mesmo aviso: o texto certo vem da API, pelo código. */
const aoFalhar = (erro: unknown) => toast.error(mensagemDoErro(erro))

/**
 * As candidatas de um item "a contratar", e em qual delas a turma votou.
 *
 * O bloco só existe enquanto a disputa está aberta: contratado o item, a escolha já aconteceu, e a
 * lista vira registro — some o "Nova proposta", somem os votos clicáveis, fica o histórico de por
 * que a turma escolheu aquela. Item cancelado não mostra nada disso.
 *
 * O voto é um por formando por item: clicar em outra proposta **muda** o seu voto, não soma um
 * segundo. Clicar na que já é sua tira o voto — é o mesmo gesto do "curtir" de qualquer lugar, e
 * evita ter um "tirar meu voto" solto na tela.
 */
export function Propostas({ item, propostas, ehGestao, editavel }: Props) {
  const [cadastro, definirCadastro] = useState<false | { proposta?: Proposta }>(false)
  const [excluindo, definirExcluindo] = useState<Proposta | false>(false)
  const votar = useVotar()
  const desvotar = useDesvotar()
  const excluir = useExcluirProposta()
  const aberta = !item.cancelado && item.quantidade_de_despesas === 0
  const votando = votar.isPending || desvotar.isPending

  const alternar = (proposta: Proposta) =>
    proposta.meu_voto
      ? desvotar.mutate(item.id, { onError: aoFalhar })
      : votar.mutate(proposta.id, { onError: aoFalhar })

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
        <p className="text-texto-muted text-sm">
          Nenhuma ainda. Liste o que a comissão levantou para a turma escolher.
        </p>
      ) : (
        <ul className="grid gap-2">
          {propostas.map((proposta) => (
            <li
              key={proposta.id}
              className={cn(
                'grid gap-2 rounded-2xl border p-3',
                proposta.meu_voto ? 'border-brand bg-brand-tint' : 'border-border',
              )}
            >
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

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={proposta.meu_voto ? 'default' : 'outline'}
                  disabled={!aberta || votando}
                  onClick={() => alternar(proposta)}
                  aria-pressed={proposta.meu_voto}
                  aria-label={`${proposta.votos} ${proposta.votos === 1 ? 'voto' : 'votos'} em ${proposta.titulo}`}
                  title={
                    aberta
                      ? proposta.meu_voto
                        ? 'Tirar meu voto'
                        : 'Votar nesta'
                      : 'A escolha da turma já aconteceu'
                  }
                >
                  <Heart className={cn('size-4', proposta.meu_voto && 'fill-current')} aria-hidden />
                  {formatarNumero(proposta.votos)}
                </Button>

                {aberta && ehGestao && editavel ? (
                  <span className="ml-auto flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground size-8 rounded-full"
                      onClick={() => definirCadastro({ proposta })}
                      aria-label={`Corrigir ${proposta.titulo}`}
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
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <DialogoDeProposta itemId={item.id} aberto={cadastro} aoFechar={() => definirCadastro(false)} />

      <DialogoDeConfirmacao
        aberto={excluindo !== false}
        aoFechar={() => definirExcluindo(false)}
        titulo={excluindo ? `Excluir a proposta "${excluindo.titulo}"?` : ''}
        descricao="Ela sai da disputa e os votos nela são apagados junto. Nada do caixa muda — proposta não é despesa."
        rotulo="Excluir"
        rotuloDeCancelar="Voltar"
        destrutivo
        aoConfirmar={() => {
          if (!excluindo) return

          const alvo = excluindo.id
          definirExcluindo(false)
          excluir.mutate(alvo, { onSuccess: () => toast.info('Proposta excluída.'), onError: aoFalhar })
        }}
      />
    </section>
  )
}
