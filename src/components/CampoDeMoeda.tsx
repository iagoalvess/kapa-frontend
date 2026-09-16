import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { formatarCentavos } from '@/lib/formato'

/** R$ 999.999.999,99 — onze dígitos, longe do limite de inteiro exato do `number`. */
const DIGITOS_MAXIMOS = 11

interface Props extends Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  /** Valor em centavos. */
  value: number
  onChange: (centavos: number) => void
}

/**
 * O campo de dinheiro do Kapa — o único. Mostra `R$ 1.234,56` e entrega centavos inteiros.
 *
 * Digita-se da direita para a esquerda, como na maquininha: `3`, `5`, `0`, `0`, `0` vira R$ 350,00.
 * Não há vírgula para errar nem ponto flutuante no caminho — o texto vira dígitos e os dígitos já
 * são os centavos.
 *
 * `value` e `onChange` com os nomes do `field` do React Hook Form: `<CampoDeMoeda {...field} />`.
 */
export function CampoDeMoeda({ value, onChange, ...props }: Props) {
  return (
    <Input
      inputMode="numeric"
      autoComplete="off"
      value={formatarCentavos(value)}
      onChange={(evento) => onChange(Number(evento.target.value.replace(/\D/g, '').slice(-DIGITOS_MAXIMOS)))}
      {...props}
    />
  )
}
