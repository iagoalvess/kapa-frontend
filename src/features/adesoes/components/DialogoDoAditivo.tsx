import { useId, useState } from 'react'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Input } from '@/components/ui/input'
import { formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
import { beneficiosPorExtenso, rotuloDoItem } from '@/types/cobranca'
import { useAceitarAditivo, useSimularAditivo, useSolicitarCodigoDoAditivo } from '../hooks/useCesta'
import type { CodigoEnviado, PacoteDisponivel, PreviaDoAditivo } from '../types/adesoes.types'
import { CampoDeCodigo } from '@/components/CampoDeCodigo'

const nome = (pacote: Pick<PacoteDisponivel, 'grupo' | 'tipo' | 'descricao'>) =>
  pacote.grupo ? `${pacote.grupo} — ${rotuloDoItem(pacote)}` : rotuloDoItem(pacote)

/**
 * O aditivo (Sprint 48, D7/D38): acrescentar à cesta depois da adesão, com o rito dela — escolher, ler o que muda e o
 * que se passa a dever, pedir o código no e-mail e aceitar.
 *
 * Só acrescenta: a faixa acima no mesmo grupo (paga-se a diferença) ou um pacote novo. Descer de faixa ou tirar é pedir
 * o cancelamento à comissão. Uma faixa por grupo, como na adesão.
 *
 * A prévia é do servidor, e o hash dela é o que o aceite devolve: se o catálogo mudar no meio, a API recusa com
 * `adesao.aditivo_desatualizado` e a pessoa volta à escolha.
 */
export function DialogoDoAditivo({
  disponiveis,
  aoFechar,
}: {
  disponiveis: PacoteDisponivel[]
  aoFechar: () => void
}) {
  const [escolha, definirEscolha] = useState<string[]>([])
  const [observacoes, definirObservacoes] = useState<Record<string, string>>({})
  const [previa, definirPrevia] = useState<PreviaDoAditivo | null>(null)
  const [envio, definirEnvio] = useState<CodigoEnviado | null>(null)
  const [codigo, definirCodigo] = useState('')
  const idDoCodigo = useId()
  const simular = useSimularAditivo()
  const pedirCodigo = useSolicitarCodigoDoAditivo()
  const aceitar = useAceitarAditivo()

  const alternar = (pacote: PacoteDisponivel) =>
    definirEscolha((atual) =>
      atual.includes(pacote.item_de_cobranca_id)
        ? atual.filter((id) => id !== pacote.item_de_cobranca_id)
        : [
            // Uma faixa por grupo: marcar a 20 desmarca a 25.
            ...atual.filter(
              (id) =>
                !pacote.grupo ||
                disponiveis.find((outro) => outro.item_de_cobranca_id === id)?.grupo !== pacote.grupo,
            ),
            pacote.item_de_cobranca_id,
          ],
    )

  const verPrevia = (evento: React.FormEvent) => {
    evento.preventDefault()
    simular.mutate(escolha, { onSuccess: definirPrevia, onError: avisarErro })
  }

  const enviarCodigo = () =>
    pedirCodigo.mutate(undefined, {
      onSuccess: (enviado) => {
        definirCodigo('')
        definirEnvio(enviado)
      },
      onError: avisarErro,
    })

  const confirmar = (evento: React.FormEvent) => {
    evento.preventDefault()
    if (!previa) return
    // O mesmo botão primeiro pede o código, depois aceita: o código vale poucos minutos e só sai depois da leitura.
    if (!envio) return enviarCodigo()

    aceitar.mutate(
      {
        pacotes: escolha,
        hash_do_conteudo: previa.hash_do_conteudo,
        codigo,
        observacoes: escolha
          .filter((id) => observacoes[id]?.trim())
          .map((id) => ({ pacote_id: id, texto: observacoes[id]!.trim() })),
      },
      {
        onSuccess: () => {
          toast.success('Aditivo aceito. As parcelas novas já estão no seu extrato.')
          aoFechar()
        },
        onError: avisarErro,
      },
    )
  }

  return (
    <DialogoDeFormulario
      aberto
      aoFechar={aoFechar}
      titulo="Acrescentar à cesta"
      descricao="Um aditivo ao seu termo: você paga só a diferença, nas parcelas que faltam."
      largura="largo"
    >
      {!previa ? (
        <form onSubmit={verPrevia} noValidate className="grid gap-4">
          <fieldset className="grid gap-2">
            <legend className="sr-only">Pacotes que podem entrar</legend>
            {disponiveis.map((pacote) => {
              const marcado = escolha.includes(pacote.item_de_cobranca_id)
              return (
                <label
                  key={pacote.item_de_cobranca_id}
                  className={cn(
                    'border-border flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3',
                    marcado && 'border-brand bg-brand-tint',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => alternar(pacote)}
                    className="size-4 shrink-0"
                  />
                  <span className="grid min-w-0 flex-1">
                    <span className="text-foreground font-medium">{nome(pacote)}</span>
                    <span className="text-muted-foreground text-xs">
                      {pacote.substitui ? 'Substitui a sua faixa atual. ' : null}
                      {beneficiosPorExtenso(pacote) ?? null}
                    </span>
                  </span>
                  <span className="text-foreground font-medium tabular-nums">
                    + {formatarCentavos(pacote.diferenca_em_centavos)}
                  </span>
                </label>
              )
            })}
          </fieldset>

          {escolha.map((id) => {
            const pacote = disponiveis.find((disponivel) => disponivel.item_de_cobranca_id === id)
            return pacote ? (
              <Input
                key={id}
                aria-label={`Detalhe de ${nome(pacote)}`}
                placeholder={`${nome(pacote)}: tamanho, nome, cor (opcional)`}
                maxLength={300}
                value={observacoes[id] ?? ''}
                onChange={(evento) =>
                  definirObservacoes((atuais) => ({ ...atuais, [id]: evento.target.value }))
                }
              />
            ) : null
          })}

          <AcoesDoFormulario
            aoCancelar={aoFechar}
            ocupado={simular.isPending}
            desabilitado={escolha.length === 0}
            rotulo="Ver o aditivo"
            rotuloOcupado="Calculando…"
          />
        </form>
      ) : (
        <form onSubmit={confirmar} noValidate className="grid gap-4">
          <ul className="grid gap-2 text-sm">
            {previa.mudancas.map((mudanca) => (
              <li key={mudanca.entra.item_id} className="flex justify-between gap-4">
                <span>
                  <span className="text-foreground font-medium">{nome(mudanca.entra)}</span>
                  {mudanca.sai ? (
                    <span className="text-muted-foreground">
                      {' '}
                      no lugar de {nome(mudanca.sai)} (já contratado:{' '}
                      {formatarCentavos(mudanca.ja_contratado_em_centavos)})
                    </span>
                  ) : null}
                </span>
                <span className="tabular-nums">+ {formatarCentavos(mudanca.diferenca_em_centavos)}</span>
              </li>
            ))}
          </ul>

          <div className="bg-muted grid gap-1 rounded-xl px-4 py-3 text-sm">
            <p className="flex items-baseline justify-between gap-4">
              <span className="text-muted-foreground">Você passa a dever a mais</span>
              <span className="text-foreground text-lg font-medium tabular-nums">
                {formatarCentavos(previa.total_em_centavos)}
              </span>
            </p>
            <ul className="text-muted-foreground grid gap-0.5">
              {previa.parcelas.map((parcela) => (
                <li
                  key={`${parcela.descricao}-${parcela.numero}`}
                  className="flex justify-between gap-4 tabular-nums"
                >
                  <span>
                    {parcela.numero}/{parcela.de} · {formatarData(parcela.vencimento)}
                  </span>
                  <span>{formatarCentavos(parcela.valor_em_centavos)}</span>
                </li>
              ))}
            </ul>
          </div>

          {envio ? (
            <div className="grid gap-2">
              <label htmlFor={idDoCodigo} className="text-foreground w-fit font-medium">
                Código enviado para {envio.email}
              </label>
              <CampoDeCodigo
                id={idDoCodigo}
                value={codigo}
                onChange={(evento) => definirCodigo(evento.target.value)}
              />
              <p className="text-texto-muted text-xs">
                Vale por cerca de {formatarNumero(envio.valido_por_minutos)} minutos.{' '}
                <button
                  type="button"
                  className="underline"
                  onClick={enviarCodigo}
                  disabled={pedirCodigo.isPending}
                >
                  Enviar outro
                </button>
              </p>
            </div>
          ) : (
            <p className="text-texto-muted text-xs">
              Para aceitar, enviamos um código para o seu e-mail — o mesmo rito da adesão.
            </p>
          )}

          <AcoesDoFormulario
            rotuloDeCancelar="Revisar"
            aoCancelar={() => {
              definirPrevia(null)
              definirEnvio(null)
            }}
            ocupado={envio ? aceitar.isPending : pedirCodigo.isPending}
            desabilitado={Boolean(envio) && codigo.length !== 6}
            rotulo={envio ? 'Aceitar aditivo' : 'Enviar código'}
            rotuloOcupado={envio ? 'Aceitando…' : 'Enviando…'}
          />
        </form>
      )}
    </DialogoDeFormulario>
  )
}
