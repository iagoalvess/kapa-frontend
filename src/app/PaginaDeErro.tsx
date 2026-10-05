import { isRouteErrorResponse, useRouteError } from 'react-router'
import { EstadoDeErro } from '@/components/EstadoDeErro'
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
    <main className="flex min-h-full items-center justify-center p-6">
      <EstadoDeErro titulo={titulo} descricao={detalhe} nivelDoTitulo={1}>
        <Button className="rounded-full px-6" onClick={() => globalThis.location.reload()}>
          Recarregar
        </Button>
      </EstadoDeErro>
    </main>
  )
}
