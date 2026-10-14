import { Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { avisarErro } from '@/lib/http/erros'
import type { EnqueteDetalhe } from '@/types/enquete'
import { useResponderEnquete, useRetirarResposta } from '../hooks/useEscritaDasEnquetes'

/** Opções, resultado agregado e escolha do titular numa mesma leitura. */
export function RespostaDaEnquete({
  detalhe,
  mostrarResultado = true,
}: {
  detalhe: EnqueteDetalhe
  mostrarResultado?: boolean
}) {
  const { enquete, opcoes } = detalhe
  const [escolhas, escolher] = useState(enquete.minha_resposta ?? [])
  const [editando, editar] = useState(!enquete.minha_resposta)
  const responder = useResponderEnquete()
  const retirar = useRetirarResposta()
  const limite = enquete.maximo_de_escolhas ?? 1
  const ocupado = responder.isPending || retirar.isPending
  const votando = enquete.pode_responder && editando
  const sucesso = (mensagem: string) => {
    toast.success(mensagem)
    editar(false)
  }

  return (
    <form
      aria-label="Opções da enquete"
      className="grid gap-3"
      onSubmit={(evento) => {
        evento.preventDefault()
        if (!votando || ocupado || escolhas.length === 0) return
        responder.mutate(
          { id: enquete.id, opcoes: escolhas },
          { onSuccess: () => sucesso('Resposta enviada.'), onError: avisarErro },
        )
      }}
    >
      <p className="text-muted-foreground text-sm">
        Voto secreto
        {enquete.tipo === 'MultiplaEscolha'
          ? ` · Até ${limite} opções por pessoa`
          : ' · Uma opção por pessoa'}
      </p>
      <fieldset disabled={ocupado} className="grid gap-3 xl:grid-cols-2">
        <legend className="sr-only">
          {enquete.tipo === 'UnicaEscolha' ? 'Escolha uma opção.' : `Escolha até ${limite} opções.`}
        </legend>
        {opcoes.map((opcao) => {
          const marcada = escolhas.includes(opcao.id)
          const minhaEscolha = enquete.minha_resposta?.includes(opcao.id)
          const desabilitada =
            !votando || (enquete.tipo === 'MultiplaEscolha' && !marcada && escolhas.length >= limite)
          return (
            <label
              key={opcao.id}
              className={cn(
                'grid min-w-0 content-start gap-3 rounded-xl border p-3',
                marcada ? 'border-brand bg-brand-tint' : 'border-border',
                votando && !desabilitada && 'hover:bg-muted cursor-pointer',
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  aria-label={opcao.texto}
                  type={enquete.tipo === 'UnicaEscolha' ? 'radio' : 'checkbox'}
                  name="resposta"
                  value={opcao.id}
                  checked={marcada}
                  disabled={desabilitada}
                  onChange={(evento) =>
                    escolher(
                      enquete.tipo === 'UnicaEscolha'
                        ? [opcao.id]
                        : evento.target.checked
                          ? [...escolhas, opcao.id]
                          : escolhas.filter((id) => id !== opcao.id),
                    )
                  }
                  className="accent-brand mt-0.5 size-4 shrink-0"
                />
                <span className="min-w-0 flex-1 text-sm font-medium [overflow-wrap:anywhere]">
                  {opcao.texto}
                </span>
                {minhaEscolha && !editando ? (
                  <span className="text-brand-text inline-flex shrink-0 items-center gap-1 text-xs">
                    <Check className="size-3.5" aria-hidden />
                    Sua escolha
                  </span>
                ) : null}
              </div>
              {mostrarResultado ? (
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {opcao.respostas} {opcao.respostas === 1 ? 'resposta' : 'respostas'}
                    </span>
                    <span className="tabular-nums">{opcao.percentual.toLocaleString('pt-BR')}%</span>
                  </div>
                  <div className="bg-muted h-1.5 overflow-hidden rounded-full" aria-hidden>
                    <div
                      className="bg-brand h-full rounded-full"
                      style={{ width: `${Math.min(100, opcao.percentual)}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </label>
          )
        })}
      </fieldset>
      {votando ? (
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={ocupado || escolhas.length === 0}>
            {ocupado ? 'Enviando…' : 'Enviar resposta'}
          </Button>
          {enquete.minha_resposta ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                escolher(enquete.minha_resposta ?? [])
                editar(false)
              }}
            >
              Cancelar
            </Button>
          ) : null}
        </div>
      ) : enquete.minha_resposta && enquete.situacao === 'Aberta' ? (
        <div className="flex flex-wrap gap-2">
          {enquete.pode_responder ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                escolher(enquete.minha_resposta ?? [])
                editar(true)
              }}
            >
              Mudar minha resposta
            </Button>
          ) : null}
          <DialogoDeConfirmacao
            titulo="Retirar sua resposta?"
            descricao="Suas escolhas sairão do resultado. Você poderá responder novamente enquanto a enquete estiver aberta."
            rotulo="Retirar"
            destrutivo
            aoConfirmar={() =>
              retirar.mutate(enquete.id, {
                onSuccess: () => sucesso('Resposta retirada.'),
                onError: avisarErro,
              })
            }
            gatilho={
              <Button type="button" variant="outline" size="sm" disabled={ocupado}>
                Retirar minha resposta
              </Button>
            }
          />
        </div>
      ) : enquete.situacao === 'Aberta' &&
        !enquete.pode_responder &&
        !enquete.motivo_do_bloqueio?.includes('termo') ? (
        <p className="text-muted-foreground text-xs">
          {enquete.motivo_do_bloqueio ?? 'A votação não está disponível no momento.'}
        </p>
      ) : null}
    </form>
  )
}
