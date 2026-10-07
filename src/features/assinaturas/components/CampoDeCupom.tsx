import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mensagemDoErro } from '@/lib/http/erros'
import { useConsultarCupom } from '../hooks/useCheckout'
import type { CupomAplicavel } from '../types/assinaturas.types'

/**
 * O "Tenho um cupom" da contratação (Sprint 51): fechado num link, abre o campo e confere na API.
 *
 * O desconto mostrado é só leitura — quem cobra é o servidor, que recalcula a partir do código no checkout. O
 * erro é sempre o mesmo ("Cupom inválido ou expirado"): a API não diz se o código existe.
 *
 * @param aplicado O cupom já conferido, ou nulo.
 * @param aoAplicar Recebe o cupom conferido, ou nulo ao remover.
 */
export function CampoDeCupom({
  aplicado,
  aoAplicar,
}: {
  aplicado: CupomAplicavel | null
  aoAplicar: (cupom: CupomAplicavel | null) => void
}) {
  const id = useId()
  const [aberto, definirAberto] = useState(false)
  const [codigo, definirCodigo] = useState('')
  const consultar = useConsultarCupom()

  if (aplicado)
    return (
      <p className="text-foreground text-sm text-pretty">
        Cupom <b className="font-semibold">{aplicado.codigo}</b>: {aplicado.percentual}% de desconto na
        primeira cobrança. Da segunda em diante, o preço cheio.{' '}
        <Button variant="link" className="h-auto p-0" onClick={() => aoAplicar(null)}>
          Remover
        </Button>
      </p>
    )

  if (!aberto)
    return (
      <Button variant="link" className="h-auto p-0" onClick={() => definirAberto(true)}>
        Tenho um cupom
      </Button>
    )

  return (
    <form
      className="grid w-full max-w-sm gap-2 text-left"
      onSubmit={(evento) => {
        evento.preventDefault()
        if (codigo.trim()) consultar.mutate(codigo, { onSuccess: aoAplicar })
      }}
    >
      <Label htmlFor={id}>Cupom</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          autoComplete="off"
          maxLength={20}
          value={codigo}
          onChange={(evento) => definirCodigo(evento.target.value.toUpperCase())}
          aria-invalid={consultar.isError}
          aria-describedby={consultar.isError ? `${id}-erro` : undefined}
        />
        <Button type="submit" variant="outline" disabled={consultar.isPending || !codigo.trim()}>
          {consultar.isPending ? 'Aplicando…' : 'Aplicar'}
        </Button>
      </div>
      {consultar.isError ? (
        <p id={`${id}-erro`} role="alert" className="text-destructive text-sm">
          {mensagemDoErro(consultar.error)}
        </p>
      ) : null}
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
