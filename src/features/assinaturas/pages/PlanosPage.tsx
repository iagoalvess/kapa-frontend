import { Link } from 'react-router'
import { toast } from 'sonner'
import { ROTAS } from '@/config/rotas'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { mensagemDoErro } from '@/lib/http/erros'
import { CardDePlano } from '../components/CardDePlano'
import { usePlanos } from '../hooks/useAssinatura'
import { useCheckout } from '../hooks/useCheckout'

/**
 * Escolha do plano e ida ao checkout hospedado.
 *
 * Gestão vê os planos; só o Presidente contrata — a API recusa os demais com 403 de qualquer forma.
 * Turma ativa não contrata de novo (`assinatura.ja_ativa`), e o botão já some antes de a API dizer.
 */
export default function PlanosPage() {
  const planos = usePlanos()
  const formatura = useFormaturaAtual()
  const { ehPresidente } = usePapel()
  const checkout = useCheckout()

  const status = formatura.data?.status
  const contratavel = ehPresidente && status !== 'Ativa' && status !== 'Encerrada'
  // Sucesso também trava: entre a resposta e a página do provedor abrir, um segundo clique criaria outra sessão.
  const aCaminho = checkout.isPending || checkout.isSuccess

  const contratar = (codigo: string) =>
    checkout.mutate(codigo, { onError: (erro) => toast.error(mensagemDoErro(erro)) })

  return (
    <section className="grid gap-5">
      <div className="grid gap-1">
        <h2 className="text-foreground text-lg font-medium">Escolha o plano da turma</h2>
        <p className="text-muted-foreground text-sm">
          O pagamento acontece na página segura do provedor — nenhum dado de cartão passa pelo Kapa.
        </p>
      </div>

      {status === 'Ativa' ? (
        <p className="bg-success-bg text-success-text rounded-xl px-4 py-3 text-sm">
          Sua turma já tem uma assinatura ativa.{' '}
          <Link to={ROTAS.assinatura} className="font-medium underline underline-offset-4">
            Ver assinatura
          </Link>
        </p>
      ) : null}

      {!ehPresidente ? (
        <p className="bg-neutral-bg text-neutral-text rounded-xl px-4 py-3 text-sm">
          Só o Presidente da comissão contrata o plano.
        </p>
      ) : null}

      {planos.isPending ? <p className="text-muted-foreground text-sm">Carregando…</p> : null}

      {planos.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {mensagemDoErro(planos.error)}
        </p>
      ) : null}

      {planos.data ? (
        <div className="motion-safe:animate-entrar grid gap-4 md:grid-cols-3">
          {planos.data.map((plano) => (
            <CardDePlano
              key={plano.id}
              plano={plano}
              aoContratar={contratavel && !aCaminho ? contratar : undefined}
              contratando={aCaminho && checkout.variables === plano.codigo}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
