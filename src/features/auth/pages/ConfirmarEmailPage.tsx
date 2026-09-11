import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { Aviso, estilos, LayoutDeAutenticacao } from '../components/LayoutDeAutenticacao'
import { useConfirmarEmail, useReenviarConfirmacao } from '../hooks/useConta'

/**
 * Chega pelo link do e-mail: `/confirmar-email?email=…&token=…`, montado pelo backend.
 *
 * A confirmação espera o clique em vez de disparar ao abrir a página: antivírus de e-mail
 * visitam os links para inspecioná-los, e confirmar no carregamento deixaria a máquina, e não a
 * pessoa, provar que o endereço é dela.
 */
export default function ConfirmarEmailPage() {
  const [parametros] = useSearchParams()
  const email = parametros.get('email')
  const token = parametros.get('token')

  const confirmar = useConfirmarEmail()
  const reenviar = useReenviarConfirmacao()

  const linkInvalido =
    !email || !token || (ehErroDaApi(confirmar.error) && confirmar.error.codigo === 'conta.link_invalido')

  if (confirmar.isSuccess) {
    return (
      <LayoutDeAutenticacao>
        <h1 className={estilos.titulo}>E-mail confirmado</h1>
        <p className={estilos.subtitulo}>Tudo certo com {email}. Sua conta está ativa.</p>
        <Button asChild className={estilos.cta}>
          <Link to={ROTAS.inicio}>Continuar</Link>
        </Button>
      </LayoutDeAutenticacao>
    )
  }

  if (linkInvalido) {
    return (
      <LayoutDeAutenticacao>
        <h1 className={estilos.titulo}>Link inválido</h1>
        <p className={estilos.subtitulo}>
          Este link de confirmação expirou ou está incompleto.
          {email ? ' Podemos mandar outro para o mesmo e-mail.' : ' Entre na sua conta para pedir outro.'}
        </p>

        {reenviar.isSuccess ? (
          <Aviso>
            Se o e-mail ainda não estiver confirmado, um novo link chega em <strong>{email}</strong> em
            instantes.
          </Aviso>
        ) : null}

        {email && !reenviar.isSuccess ? (
          <Button
            disabled={reenviar.isPending}
            onClick={() => reenviar.mutate(email)}
            className={estilos.cta}
          >
            {reenviar.isPending ? 'Enviando…' : 'Enviar novo link'}
          </Button>
        ) : (
          <Button asChild className={estilos.cta}>
            <Link to={ROTAS.login}>Ir para o login</Link>
          </Button>
        )}
      </LayoutDeAutenticacao>
    )
  }

  return (
    <LayoutDeAutenticacao>
      <h1 className={estilos.titulo}>Confirme seu e-mail</h1>
      <p className={estilos.subtitulo}>
        Falta um clique para ativar a conta de <span className="text-foreground font-semibold">{email}</span>.
      </p>

      {confirmar.isError ? (
        <p role="alert" className="text-destructive mb-4 text-sm">
          {mensagemDoErro(confirmar.error)}
        </p>
      ) : null}

      <Button
        disabled={confirmar.isPending}
        onClick={() => confirmar.mutate({ email, token })}
        className={estilos.cta}
      >
        {confirmar.isPending ? 'Confirmando…' : 'Confirmar e-mail'}
      </Button>
    </LayoutDeAutenticacao>
  )
}
