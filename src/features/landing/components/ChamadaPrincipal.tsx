import { GraduationCap } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { env } from '@/config/env'
import { ROTAS, urlDoApp } from '@/config/rotas'
import { ANCORA_DA_LISTA_DE_ESPERA } from './ListaDeEspera'

/**
 * O CTA da landing, em todo lugar onde ele aparece — cabeçalho, capa, "Como funciona".
 *
 * Com a lista de espera ligada (Sprint 36), leva ao formulário na própria página, e nenhum botão
 * aponta para o `app.`, que ainda não está no ar. Desligada, é o "Criar minha turma" de sempre.
 *
 * @param props As do `Button` (`size`, `className`, e o `onClick` com que a gaveta fecha), que o `asChild`
 * passa ao link.
 */
export function ChamadaPrincipal(props: ComponentProps<typeof Button>) {
  return (
    <Button asChild {...props}>
      <a href={env.VITE_LISTA_DE_ESPERA ? `#${ANCORA_DA_LISTA_DE_ESPERA}` : urlDoApp(ROTAS.criarConta)}>
        <GraduationCap className="size-4" aria-hidden />
        {env.VITE_LISTA_DE_ESPERA ? 'Entrar na lista de espera' : 'Criar minha turma'}
      </a>
    </Button>
  )
}
