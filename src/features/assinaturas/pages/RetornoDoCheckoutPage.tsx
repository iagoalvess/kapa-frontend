import { Clock, LoaderCircle } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import mascoteFoguete from '@/assets/mascote/foguete.webp'
import { EstadoDeErro } from '@/components/EstadoDeErro'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { useAssinaturaDoRetorno } from '../hooks/useAssinatura'
import type { EstadoDoPagamentoConfirmado } from '../types/assinaturas.types'

/** Quanto a tela espera antes de admitir que o pagamento está demorando. */
const TETO_DA_ESPERA = 60_000

/**
 * Para onde o provedor devolve o navegador depois do pagamento.
 *
 * Esta tela **não ativa nada** e não confia no fato de ter sido aberta: usuário fecha a aba, perde
 * sinal, volta pelo histórico. Ela só consulta a assinatura a cada 3 s enquanto está pendente —
 * quem ativa é o webhook.
 *
 * Três estados: processando (até 60 s), confirmada, e demorou. O terceiro é o que evita o spinner
 * infinito que faz a pessoa pagar de novo: passado o teto, a tela diz que é seguro sair, porque é —
 * o webhook, ou a conciliação, resolve sozinho.
 *
 * **A confirmação não é uma tela.** Ela navega para o Início com o recado no `state`
 * (`DialogoDePagamentoConfirmado`), que abre o cartão da Sprint 61 sobre a página da turma: a pessoa
 * fecha o aviso e já está onde queria. Os outros dois estados continuam no `Quadro`: são espera, não
 * chegada.
 */
export default function RetornoDoCheckoutPage() {
  const [demorou, definirDemorou] = useState(false)

  useEffect(() => {
    const relogio = setTimeout(() => definirDemorou(true), TETO_DA_ESPERA)
    return () => clearTimeout(relogio)
  }, [])

  const assinatura = useAssinaturaDoRetorno()

  const confirmada = assinatura.data?.status === 'Ativa'

  if (!assinatura.data && assinatura.isError) {
    const semContratacao =
      ehErroDaApi(assinatura.error) && assinatura.error.codigo === 'assinatura.nao_encontrada'

    return (
      <EstadoDeErro
        titulo={semContratacao ? 'Nenhuma contratação em andamento' : 'Não foi possível consultar'}
        descricao={semContratacao ? 'Escolha um plano para contratar.' : mensagemDoErro(assinatura.error)}
      >
        {semContratacao ? null : (
          <Button onClick={() => void assinatura.refetch()} className="rounded-full px-6">
            Tentar de novo
          </Button>
        )}
        <Button asChild variant={semContratacao ? 'default' : 'outline'} className="rounded-full px-6">
          <Link to={ROTAS.planos}>Ver planos</Link>
        </Button>
      </EstadoDeErro>
    )
  }

  if (confirmada)
    return (
      <Navigate
        to={ROTAS.inicio}
        replace
        state={
          {
            pagamentoConfirmado: assinatura.data?.plano.nome ?? 'contratado',
          } satisfies EstadoDoPagamentoConfirmado
        }
      />
    )

  if (demorou)
    return (
      <Quadro icone={<Clock />} titulo="O pagamento pode levar alguns minutos">
        <p>
          Assim que o pagamento for confirmado, a turma é liberada e avisamos por e-mail. Você já pode sair
          desta página com segurança — não é preciso pagar de novo.
        </p>
        <Button asChild variant="outline" className="justify-self-center">
          <Link to={ROTAS.inicio}>Voltar para a turma</Link>
        </Button>
      </Quadro>
    )

  return (
    <Quadro
      icone={
        <span className="relative mx-auto">
          <img src={mascoteFoguete} alt="" className="w-36 drop-shadow-lg" />
          {/* O giro fica: a imagem parada não diz que a tela está trabalhando. */}
          <LoaderCircle className="text-brand absolute right-0 bottom-2 size-7 animate-spin" aria-hidden />
        </span>
      }
      titulo="Estamos confirmando seu pagamento…"
    >
      <p>Não feche esta página. Isso costuma levar poucos segundos.</p>
    </Quadro>
  )
}

function Quadro({ icone, titulo, children }: { icone: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <section
      aria-live="polite"
      className="bg-card shadow-cartao text-muted-foreground mx-auto grid max-w-md gap-4 rounded-3xl p-8 text-center text-sm [&>svg]:mx-auto [&>svg]:size-10"
    >
      {icone}
      <h2 className="text-foreground text-xl leading-snug font-medium">{titulo}</h2>
      {children}
    </section>
  )
}
