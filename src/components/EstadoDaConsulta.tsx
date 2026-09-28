import { Button } from '@/components/ui/button'
import { mensagemDoErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'

/**
 * A falha de uma consulta, em vermelho e anunciada pelo leitor de tela.
 *
 * O texto sai de `mensagemDoErro`: da API quando ela explicou, e a frase padrão quando não.
 *
 * @param erro O `error` da consulta.
 * @param className Respiro de quem hospeda; o tom é daqui.
 * @param aoTentarDeNovo Com ele, a mensagem ganha o botão "Tentar de novo" — para a tela em que a
 *   consulta é tudo o que há, e sem ela a pessoa só teria o F5.
 */
export function ErroDaConsulta({
  erro,
  className,
  aoTentarDeNovo,
}: {
  erro: unknown
  className?: string
  aoTentarDeNovo?: () => void
}) {
  if (!aoTentarDeNovo) {
    return (
      <p role="alert" className={cn('text-destructive text-sm', className)}>
        {mensagemDoErro(erro)}
      </p>
    )
  }

  return (
    <div className={cn('grid justify-items-start gap-3', className)}>
      <p role="alert" className="text-destructive text-sm">
        {mensagemDoErro(erro)}
      </p>
      <Button variant="outline" size="sm" onClick={aoTentarDeNovo}>
        Tentar de novo
      </Button>
    </div>
  )
}
