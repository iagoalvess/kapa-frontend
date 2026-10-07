import { useId } from 'react'
import { Selo } from '@/components/Selo'
import { Input } from '@/components/ui/input'

/** O mínimo de um convite para escolher — serve ao da Gestão e ao do comprador. */
interface ConviteEscolhivel {
  id: string
  sequencial: number
  codigo: string
  nome_do_convidado: string | null
  validado_em: string | null
}

/**
 * A lista de convites com caixa de marcar, para escolher o que cancelar (Sprint 38, P4: cancela-se por
 * convite, não só a compra inteira).
 *
 * O convite que já entrou na festa aparece travado — convite usado não se cancela (P3) —, e a tela diz por
 * quê em vez de esconder.
 *
 * @param convites Os convites válidos.
 * @param escolhidos Os ids marcados.
 * @param aoMudar Recebe a lista nova de ids marcados.
 */
export function EscolhaDeConvites({
  convites,
  escolhidos,
  aoMudar,
}: {
  convites: ConviteEscolhivel[]
  escolhidos: string[]
  aoMudar: (ids: string[]) => void
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-foreground mb-2 text-sm font-medium">Convites</legend>
      {convites.map((convite) => (
        <label
          key={convite.id}
          className="has-disabled:text-muted-foreground flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm has-disabled:cursor-not-allowed"
        >
          <input
            type="checkbox"
            checked={escolhidos.includes(convite.id)}
            disabled={convite.validado_em !== null}
            onChange={(evento) =>
              aoMudar(
                evento.target.checked
                  ? [...escolhidos, convite.id]
                  : escolhidos.filter((id) => id !== convite.id),
              )
            }
            className="size-4 shrink-0"
          />
          <span className="grid min-w-0 flex-1">
            <span className="font-medium">
              {convite.nome_do_convidado ?? `Convite ${convite.sequencial}`}
            </span>
            <span className="text-muted-foreground text-xs">{convite.codigo}</span>
          </span>
          {convite.validado_em ? <Selo tom="sucesso">Já entrou</Selo> : null}
        </label>
      ))}
    </fieldset>
  )
}

/**
 * O campo do motivo, curto — vai para a auditoria, a portaria e o e-mail.
 *
 * @param valor O texto.
 * @param aoMudar Recebe o texto novo.
 * @param rotulo O nome do campo.
 * @param exemplo O placeholder.
 */
export function CampoDoMotivo({
  valor,
  aoMudar,
  rotulo = 'Motivo',
  exemplo,
}: {
  valor: string
  aoMudar: (valor: string) => void
  rotulo?: string
  exemplo?: string
}) {
  const campo = useId()

  return (
    <div className="grid gap-2 text-sm">
      <label htmlFor={campo} className="text-foreground w-fit font-medium">
        {rotulo}
      </label>
      <Input
        id={campo}
        value={valor}
        maxLength={300}
        onChange={(evento) => aoMudar(evento.target.value)}
        placeholder={exemplo}
      />
    </div>
  )
}
