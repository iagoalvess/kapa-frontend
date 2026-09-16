import { mensagemDoErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'

/**
 * A falha de uma consulta, em vermelho e anunciada pelo leitor de tela.
 *
 * O texto sai de `mensagemDoErro`: da API quando ela explicou, e a frase padrão quando não.
 *
 * @param erro O `error` da consulta.
 * @param className Respiro de quem hospeda; o tom é daqui.
 */
export function ErroDaConsulta({ erro, className }: { erro: unknown; className?: string }) {
  return (
    <p role="alert" className={cn('text-destructive text-sm', className)}>
      {mensagemDoErro(erro)}
    </p>
  )
}
