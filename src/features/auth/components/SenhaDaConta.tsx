import { Button } from '@/components/ui/button'
import { mensagemDoErro } from '@/lib/http/erros'
import { useAcessoDaConta, useSolicitarRedefinicao } from '../hooks/useConta'
import { DialogoDeSenha } from './DialogoDeSenha'

/** Escolhe a ação de senha pelo estado privado da própria conta. */
export function SenhaDaConta() {
  const acesso = useAcessoDaConta()
  const solicitar = useSolicitarRedefinicao()
  if (acesso.isPending)
    return (
      <Button variant="outline" size="sm" disabled>
        Carregando…
      </Button>
    )
  if (acesso.isError)
    return (
      <div>
        <p role="alert">{mensagemDoErro(acesso.error)}</p>
        <Button variant="outline" size="sm" onClick={() => void acesso.refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  if (acesso.data.tem_senha) return <DialogoDeSenha />
  return (
    <div className="grid gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={solicitar.isPending}
        onClick={() => solicitar.mutate(acesso.data.email)}
      >
        {solicitar.isPending ? 'Enviando…' : 'Definir senha'}
      </Button>
      {solicitar.isSuccess ? (
        <output className="text-muted-foreground text-sm">
          Enviamos um link para definir sua senha. Google continuará disponível.
        </output>
      ) : null}
      {solicitar.error ? <p role="alert">{mensagemDoErro(solicitar.error)}</p> : null}
    </div>
  )
}
