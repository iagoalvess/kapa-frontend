import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mensagemDoErro } from '@/lib/http/erros'
import { useConsultarCupom } from '../hooks/useCheckout'
import type { CupomAplicavel } from '../types/assinaturas.types'

/**
 * O campo de cupom da contratação (Sprint 51), sempre visível: confere o código na API e mostra o
 * desconto da primeira cobrança. A tela o esconde quando a turma já tem assinatura, porque aí a API
 * responderia "inválido" — o desconto vale só na primeira contratação.
 *
 * O desconto mostrado é só leitura — quem cobra é o servidor, que recalcula a partir do código no
 * checkout. O erro é sempre o mesmo ("Cupom inválido ou expirado"): a API não diz se o código existe.
 *
 * @param aplicado O cupom já conferido, ou nulo.
 * @param aoAplicar Recebe o cupom conferido, ou nulo ao remover.
 */
export function CampoDeCupom({
  aplicado,
  aoAplicar,
  aoMudarConsulta,
}: {
  aplicado: CupomAplicavel | null
  aoAplicar: (cupom: CupomAplicavel | null) => void
  /** Impede continuar para o pagamento enquanto o desconto ainda está sendo conferido. */
  aoMudarConsulta?: (consultando: boolean) => void
}) {
  const id = useId()
  const [codigo, definirCodigo] = useState('')
  const consultar = useConsultarCupom()

  if (aplicado)
    return (
      <div className="border-brand-wash bg-brand-wash/50 flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-left">
        <p className="text-foreground flex-1 text-sm text-pretty">
          <b className="font-semibold">{aplicado.codigo}</b>: {aplicado.percentual}% de desconto na primeira
          cobrança. Da segunda em diante, o preço cheio.
        </p>
        <Button variant="link" className="h-auto shrink-0 p-0 text-sm" onClick={() => aoAplicar(null)}>
          Remover
        </Button>
      </div>
    )

  return (
    <form
      className="grid w-full max-w-sm gap-2 text-left"
      onSubmit={(evento) => {
        evento.preventDefault()
        if (!codigo.trim() || consultar.isPending) return
        aoMudarConsulta?.(true)
        consultar.mutate(codigo, {
          onSuccess: aoAplicar,
          onSettled: () => aoMudarConsulta?.(false),
        })
      }}
    >
      <Label htmlFor={id}>Cupom de desconto</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          className="flex-1 font-mono tracking-wide"
          autoComplete="off"
          placeholder="PRIMEIRACOMPRA20"
          maxLength={20}
          disabled={consultar.isPending}
          value={codigo}
          onChange={(evento) => definirCodigo(evento.target.value.toUpperCase())}
          aria-invalid={consultar.isError}
          aria-describedby={`${id}-dica`}
        />
        <Button type="submit" variant="outline" disabled={consultar.isPending || !codigo.trim()}>
          {consultar.isPending ? 'Aplicando…' : 'Aplicar'}
        </Button>
      </div>
      {consultar.isError ? (
        <p id={`${id}-dica`} role="alert" className="text-destructive text-sm">
          {mensagemDoErro(consultar.error)}
        </p>
      ) : (
        <p id={`${id}-dica`} className="text-texto-muted text-xs">
          O desconto vale só na primeira cobrança.
        </p>
      )}
    </form>
  )
}

/**
 * O preço da primeira cobrança com o cupom — a mesma conta do `Cupom.ComDesconto` do back: o desconto arredonda
 * para baixo, a favor da turma.
 *
 * @param precoEmCentavos Preço cheio do ciclo.
 * @param percentual Desconto, em %.
 */
export function comDesconto(precoEmCentavos: number, percentual: number) {
  return precoEmCentavos - Math.floor((precoEmCentavos * percentual) / 100)
}
