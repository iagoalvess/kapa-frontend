import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * `<select>` com a cara do Kapa: borda e foco do `Input`, seta própria e, nos navegadores que já
 * deixam estilizar a lista aberta (`appearance: base-select`), a lista também — as regras ficam em
 * `styles/index.css`, sob `[data-select]`. Nos outros, a lista aberta é a do sistema.
 *
 * Nativo de propósito: teclado, leitor de tela e a roleta do celular vêm prontos. Todas as props
 * vão para o `<select>`, então funciona direto dentro do `FormControl`.
 */
export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    // `inline-block`: solto (numa célula de tabela) fica do tamanho das opções; em grid ou flex, estica.
    <div className="relative inline-block align-middle">
      <select
        data-select=""
        className={cn(
          'peer border-input bg-card text-foreground h-11 w-full cursor-pointer appearance-none rounded-lg border pr-10 pl-3 text-base shadow-xs outline-none md:text-[15px]',
          'hover:border-brand-soft focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
      <ChevronDown
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 transition-transform peer-open:rotate-180"
      />
    </div>
  )
}
