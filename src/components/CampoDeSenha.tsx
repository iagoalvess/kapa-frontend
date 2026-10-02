import { Eye, EyeOff } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * O campo de senha do Kapa: um `Input` com o olhinho que revela o que foi digitado.
 *
 * Todas as props vão para o `<input>`, como no `Select`: dentro do `FormControl` o `id`, o
 * `aria-describedby` e o `ref` do React Hook Form chegam ao campo, e o `FormLabel` continua ligado
 * a ele. O `type` é do componente — o olhinho é quem decide entre `password` e `text`.
 *
 * O botão é `type="button"` para não enviar o formulário e leva `aria-controls` com o `id` do campo
 * que revela: com três senhas no mesmo diálogo, o nome sozinho não diria de qual delas se trata.
 *
 * Mora em `components/` porque duas features o usam (`auth` nas telas de conta e `privacidade` na
 * exclusão de dados); antes cada campo repetia `type="password"` e nenhum deles deixava ver o que
 * se digitou.
 */
export function CampoDeSenha({ id, className, ...props }: ComponentProps<typeof Input>) {
  const [visivel, definirVisivel] = useState(false)

  return (
    <div className="relative">
      <Input id={id} {...props} type={visivel ? 'text' : 'password'} className={cn('pr-10', className)} />
      <button
        type="button"
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        aria-controls={id}
        onClick={() => definirVisivel((revelada) => !revelada)}
        className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
      >
        {visivel ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  )
}
