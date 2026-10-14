import { EstadoDeErro } from '@/components/EstadoDeErro'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { EMAIL_DE_SUPORTE } from '@/lib/suporte'
import { mensagemDoErro } from '@/lib/http/erros'
import { estilos, LayoutDeAutenticacao } from '@/components/layout/LayoutDeAutenticacao'
import { useDescadastrar } from '../hooks/useMarketing'

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
          Não vamos mais mandar dicas e novidades do Kapa para você. Os avisos da sua conta e da turma
          continuam chegando.
        </p>
      </LayoutDeAutenticacao>
    )
  }

  if (!token) {
    return (
      <LayoutDeAutenticacao>
        <EstadoDeErro
          compacto
          nivelDoTitulo={1}
          titulo="Link incompleto"
          descricao={
            <>
              Este link de descadastro chegou pela metade. Use o link no rodapé do e-mail ou peça o
              descadastro ao suporte.
            </>
          }
        >
          <Button asChild className="w-full rounded-full">
            <a href={`mailto:${EMAIL_DE_SUPORTE}?subject=Descadastro%20de%20marketing`}>
              Falar com o suporte
            </a>
          </Button>
        </EstadoDeErro>
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
        <p role="alert" className="text-danger-text mb-4 text-sm">
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
