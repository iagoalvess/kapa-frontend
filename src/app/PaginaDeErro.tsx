import { isRouteErrorResponse, useRouteError } from 'react-router'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { Button } from '@/components/ui/button'
import { mensagemDoErro } from '@/lib/http/erros'

/**
 * Tela mostrada quando uma rota estoura.
 *
 * É o `errorElement` da raiz: sem ele, um erro em qualquer página apaga a aplicação inteira e
 * deixa a tela branca, sem nada a fazer além de recarregar.
 */
export function PaginaDeErro() {
  const erro = useRouteError()

  const titulo = isRouteErrorResponse(erro) ? `Erro ${erro.status}` : 'Algo deu errado'
  const detalhe = isRouteErrorResponse(erro) ? erro.statusText : mensagemDoErro(erro)

  return (
    <main className="motion-safe:animate-entrar flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <LogoKapa className="h-9" />
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      <p className="text-muted-foreground max-w-md text-sm">{detalhe}</p>
      <Button onClick={() => globalThis.location.reload()}>Recarregar</Button>
    </main>
  )
}
