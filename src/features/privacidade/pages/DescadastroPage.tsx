import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { mensagemDoErro } from '@/lib/http/erros'
import { estilos, LayoutDeAutenticacao } from '@/components/layout/LayoutDeAutenticacao'
import { useDescadastrar } from '../hooks/usePrivacidade'

/**
 * O "Não quero mais receber" do e-mail de marketing: `/descadastro?token=…`, sem login (Sprint 40).
 *
 * Espera o clique, como a confirmação de e-mail: antivírus de e-mail visitam os links, e sair ao abrir a
 * página tiraria da lista quem nunca pediu. O "um clique" de verdade é o do Gmail, que faz o `POST` sozinho
 * pelo cabeçalho `List-Unsubscribe-Post`.
 *
 * A API responde o mesmo para token válido, vencido ou adulterado, então a tela também: "Pronto".
 */
export default function DescadastroPage() {
  const [parametros] = useSearchParams()
  const token = parametros.get('token')
  const descadastrar = useDescadastrar()

  if (descadastrar.isSuccess) {
    return (
      <LayoutDeAutenticacao>
        <h1 className={estilos.titulo}>Pronto, você não recebe mais</h1>
        <p className={estilos.subtitulo}>
          Não vamos mais mandar dicas e novidades do Kapa para você. Mudou de ideia? É só ligar de novo em
          Minha privacidade.
        </p>
        <Button asChild className={estilos.cta}>
          <Link to={ROTAS.minhaPrivacidade}>Ir para Minha privacidade</Link>
        </Button>
      </LayoutDeAutenticacao>
    )
  }

  if (!token) {
    return (
      <LayoutDeAutenticacao>
        <h1 className={estilos.titulo}>Link incompleto</h1>
        <p className={estilos.subtitulo}>
          Este link de descadastro chegou pela metade. Entre na sua conta e desligue as novidades em Minha
          privacidade.
        </p>
        <Button asChild className={estilos.cta}>
          <Link to={ROTAS.minhaPrivacidade}>Ir para Minha privacidade</Link>
        </Button>
      </LayoutDeAutenticacao>
    )
  }

  return (
    <LayoutDeAutenticacao>
      <h1 className={estilos.titulo}>Não quer mais receber?</h1>
      <p className={estilos.subtitulo}>
        Você deixa de receber as dicas e novidades do Kapa. Os avisos da sua turma — cobrança, convite, senha
        — continuam chegando.
      </p>

      {descadastrar.isError ? (
        <p role="alert" className="text-destructive mb-4 text-sm">
          {mensagemDoErro(descadastrar.error)}
        </p>
      ) : null}

      <Button
        disabled={descadastrar.isPending}
        onClick={() => descadastrar.mutate(token)}
        className={estilos.cta}
      >
        {descadastrar.isPending ? 'Saindo…' : 'Não quero mais receber'}
      </Button>
    </LayoutDeAutenticacao>
  )
}
