import { useQueryClient } from '@tanstack/react-query'
import { Clock, LoaderCircle } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router'
import mascoteCanudo from '@/assets/mascote/canudo.webp'
import mascoteFoguete from '@/assets/mascote/foguete.webp'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { CHAVE_DA_FORMATURA_ATUAL } from '@/hooks/useFormaturaAtual'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { useAssinatura } from '../hooks/useAssinatura'

/** Quanto a tela espera antes de admitir que o pagamento está demorando. */
const TETO_DA_ESPERA = 60_000

const INTERVALO = 3_000

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
 */
export default function RetornoDoCheckoutPage() {
  const cliente = useQueryClient()
  const [demorou, definirDemorou] = useState(false)

  useEffect(() => {
    const relogio = setTimeout(() => definirDemorou(true), TETO_DA_ESPERA)
    return () => clearTimeout(relogio)
  }, [])

  const assinatura = useAssinatura({
    refetchInterval: (consulta) => (consulta.state.data?.status === 'Pendente' ? INTERVALO : false),
  })

  const confirmada = assinatura.data?.status === 'Ativa'

  // A faixa de status do layout lê a formatura, que o webhook acabou de ativar: sem isto ela
  // continuaria dizendo "conclua a contratação" ao lado do "pagamento confirmado".
  useEffect(() => {
    if (confirmada) void cliente.invalidateQueries({ queryKey: CHAVE_DA_FORMATURA_ATUAL })
  }, [confirmada, cliente])

  if (!assinatura.data && assinatura.isError) {
    const semContratacao =
      ehErroDaApi(assinatura.error) && assinatura.error.codigo === 'assinatura.nao_encontrada'

    return (
      <Quadro
        icone={<Clock />}
        titulo={semContratacao ? 'Nenhuma contratação em andamento' : 'Não foi possível consultar'}
      >
        <p role="alert">
          {semContratacao ? 'Escolha um plano para contratar.' : mensagemDoErro(assinatura.error)}
        </p>
        <Button asChild variant="outline" className="justify-self-center">
          <Link to={ROTAS.planos}>Ver planos</Link>
        </Button>
      </Quadro>
    )
  }

  if (confirmada)
    return (
      <Quadro
        icone={<img src={mascoteCanudo} alt="" className="mx-auto w-36 drop-shadow-lg" />}
        titulo="Pagamento confirmado"
      >
        <p>A assinatura do plano {assinatura.data?.plano.nome} está ativa e a turma já pode usar tudo.</p>
        <Button asChild className="justify-self-center">
          <Link to={ROTAS.inicio}>Ir para a turma</Link>
        </Button>
      </Quadro>
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
      <h2 className="text-foreground text-lg font-medium">{titulo}</h2>
      {children}
    </section>
  )
}
