import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const DIGITOS = 6

/**
 * O código de seis dígitos em seis caixas.
 *
 * As caixas são só desenho: por cima delas há um `<input>` só, transparente, que recebe o foco, o
 * teclado numérico, o colar e o preenchimento automático do celular (`one-time-code`) — seis inputs
 * separados quebrariam os dois últimos. Todas as props vão para ele, então funciona direto dentro
 * do `FormControl`.
 */
export function CampoDeCodigo({ value, onChange, className, ...props }: ComponentProps<'input'>) {
  const digitado = String(value ?? '')
  const atual = Math.min(digitado.length, DIGITOS - 1)

  return (
    <div className={cn('group relative flex justify-center gap-2', className)}>
      <input
        {...props}
        value={digitado}
        onChange={(evento) => {
          evento.target.value = evento.target.value.replace(/\D/g, '').slice(0, DIGITOS)
          onChange?.(evento)
        }}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={DIGITOS}
        className="absolute inset-0 z-10 cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent"
      />
      {Array.from({ length: DIGITOS }, (_, indice) => (
        <span
          key={indice}
          aria-hidden
          className={cn(
            'border-input bg-card text-foreground flex size-12 items-center justify-center rounded-xl border text-xl font-medium tabular-nums shadow-xs',
            indice === atual &&
              'group-focus-within:border-ring group-focus-within:ring-ring/50 group-focus-within:ring-[3px]',
          )}
        >
          {digitado[indice]}
        </span>
      ))}
    </div>
  )
}
