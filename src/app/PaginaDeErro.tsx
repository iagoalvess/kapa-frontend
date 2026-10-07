import { isRouteErrorResponse, useRouteError } from 'react-router'
import { EstadoDeErro } from '@/components/EstadoDeErro'
import { Button } from '@/components/ui/button'
import { codigoParaOSuporte, mensagemDoErro } from '@/lib/http/erros'
import { linkDeSuporte } from '@/lib/suporte'

/**
 * Tela mostrada quando uma rota estoura.
 *
 * É o `errorElement` da raiz: sem ele, um erro em qualquer página apaga a aplicação inteira e
 * deixa a tela branca, sem nada a fazer além de recarregar.
 *
 * Aqui quase sempre é bug da tela, e não falha da API: não há `trace_id` para procurar, então o "Reportar" leva a
 * mensagem do erro no e-mail — com a página, a turma e o navegador, que já bastam para reproduzir.
 */
export function PaginaDeErro() {
  const erro = useRouteError()

  const titulo = isRouteErrorResponse(erro) ? `Erro ${erro.status}` : 'Algo deu errado'
  const detalhe = isRouteErrorResponse(erro) ? erro.statusText : mensagemDoErro(erro)
  const tecnico = erro instanceof Error ? `${erro.name}: ${erro.message}` : detalhe

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <EstadoDeErro titulo={titulo} descricao={detalhe} nivelDoTitulo={1}>
        <div className="flex flex-wrap justify-center gap-2">
          <Button className="rounded-full px-6" onClick={() => globalThis.location.reload()}>
            Recarregar
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6">
            <a href={linkDeSuporte({ codigo: codigoParaOSuporte(erro), detalhe: tecnico })}>
              Reportar o problema
            </a>
          </Button>
        </div>
      </EstadoDeErro>
    </main>
  )
}
