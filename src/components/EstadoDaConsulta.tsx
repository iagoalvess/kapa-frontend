import { RotateCcw } from 'lucide-react'
import { EstadoDeErro } from '@/components/EstadoDeErro'
import { Button } from '@/components/ui/button'
import { codigoParaOSuporte, ErroDaApi, ErroDeRede, mensagemDoErro } from '@/lib/http/erros'
import { linkDeSuporte } from '@/lib/suporte'
import { cn } from '@/lib/utils'

/**
 * A falha de uma consulta, no mesmo desenho das páginas de erro e com a mensagem da API.
 * `compacto` adapta a ilustração a cartões; `emLinha` mantém erros de uma ação junto ao formulário.
 *
 * O 404 não é falha de carregar: o registro não existe (ou não é de quem pede — a API responde igual
 * aos dois). Tentar de novo daria a mesma resposta, então o botão some e o título diz o que houve.
 *
 * Falha do servidor (5xx) mostra o código do erro e o "Reportar" — o `mailto:` do suporte com o código no corpo.
 */
export function ErroDaConsulta({
  erro,
  className,
  aoTentarDeNovo,
  compacto = false,
  emLinha = false,
}: {
  erro: unknown
  className?: string
  aoTentarDeNovo?: () => void
  compacto?: boolean
  emLinha?: boolean
}) {
  const codigo = codigoParaOSuporte(erro)

  if (emLinha) {
    return (
      <p role="alert" className={cn('text-danger-text text-sm', className)}>
        {mensagemDoErro(erro)}
        {codigo ? (
          <>
            {' '}
            <ParaOSuporte codigo={codigo} />
          </>
        ) : null}
      </p>
    )
  }

  const erroDeRede = erro instanceof ErroDeRede
  const naoEncontrado = erro instanceof ErroDaApi && erro.status === 404

  return (
    <EstadoDeErro
      titulo={
        erroDeRede
          ? 'A conexão deu uma pausa'
          : naoEncontrado
            ? 'Não encontramos'
            : 'Não conseguimos carregar'
      }
      descricao={mensagemDoErro(erro)}
      erroDeRede={erroDeRede}
      compacto={compacto}
      className={className}
    >
      {codigo ? (
        <p className="text-muted-foreground text-xs">
          <ParaOSuporte codigo={codigo} />
        </p>
      ) : null}
      {aoTentarDeNovo && !naoEncontrado ? (
        <Button type="button" onClick={aoTentarDeNovo} className="max-w-full gap-2 rounded-full px-6">
          <RotateCcw aria-hidden="true" className="size-4" />
          Tentar de novo
        </Button>
      ) : null}
    </EstadoDeErro>
  )
}

/** "Código do erro: X · Reportar": o que a pessoa copia, e o atalho que já manda o código ao suporte. */
function ParaOSuporte({ codigo }: { codigo: string }) {
  return (
    <span className="text-muted-foreground">
      Código do erro: <span className="font-mono select-all">{codigo}</span> ·{' '}
      <a
        href={linkDeSuporte({ codigo })}
        className="text-brand-text font-medium underline underline-offset-2"
      >
        Reportar
      </a>
    </span>
  )
}
