import { GraduationCap } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { env } from '@/config/env'
import { ROTAS, urlDoApp } from '@/config/rotas'
import { ANCORA_DA_LISTA_DE_ESPERA } from './ListaDeEspera'

/**
 * O CTA da landing, em todo lugar onde ele aparece — cabeçalho, capa, "Como funciona".
 *
 * O texto é sempre "Criar minha turma" (escolha de 28/09/2026). Com a lista de espera ligada (Sprint 36),
 * leva ao formulário na própria página, e nenhum botão aponta para o `app.`, que ainda não está no ar.
 *
 * @param props As do `Button` (`size`, `className`, e o `onClick` com que a gaveta fecha), que o `asChild`
 * passa ao link.
 */
export function ChamadaPrincipal(props: ComponentProps<typeof Button>) {
  return (
    <Button asChild {...props}>
      <a href={env.VITE_LISTA_DE_ESPERA ? `#${ANCORA_DA_LISTA_DE_ESPERA}` : urlDoApp(ROTAS.criarConta)}>
        <GraduationCap className="size-4" aria-hidden />
        Criar minha turma
      </a>
    </Button>
  )
}
