import { WalletMinimal } from 'lucide-react'
import { Link } from 'react-router'
import mascoteFeliz from '@/assets/mascote/feliz.webp'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { Button } from '@/components/ui/button'
import { ROTAS, rotaDoPagamento } from '@/config/rotas'
import { useExtrato } from '@/features/pagamentos'
import { diasAte, formatarCentavos, formatarData } from '@/lib/formato'
import { rotuloDoItem, valorNaLista } from '@/types/cobranca'

/**
 * Quanto tempo a parcela tem, dito como se fala.
 *
 * O dia exato fica logo abaixo: aqui é a urgência, que é o que decide se a pessoa paga agora ou
 * fecha a aba.
 */
function prazo(vencimento: string) {
  const dias = diasAte(vencimento)

  if (dias === null) return ''
  if (dias < 0) return dias === -1 ? 'venceu ontem' : `venceu há ${Math.abs(dias)} dias`
  if (dias === 0) return 'vence hoje'
  if (dias === 1) return 'vence amanhã'

  return `vence em ${dias} dias`
}

/**
 * A próxima parcela do próprio formando, com o botão que abre o PIX.
 *
 * É o único número desta tela que aponta para uma pessoa — a que está lendo. O extrato continua
 * sendo a tela do assunto; aqui fica só a primeira a pagar, que é a pergunta de quem abriu o app
 * para pagar e não quer procurar.
 *
 * Quem está em dia vê o mascote e uma linha dizendo isso: cartão vazio numa home é um buraco, e
 * "nada a pagar" é uma boa notícia que vale a pena dar.
 */
export function CartaoDaProximaParcela() {
  const extrato = useExtrato()
  const proxima = extrato.data?.proxima

  return (
    <Cartao
      titulo="Sua próxima parcela"
      icone={WalletMinimal}
      acao={
        <Link
          to={ROTAS.extrato}
          className="text-brand-text text-sm underline underline-offset-4 hover:opacity-85"
        >
          Ver todas
        </Link>
      }
    >
      {extrato.isPending ? <EsqueletoDeTexto linhas={2} /> : null}

      {extrato.data && !proxima ? (
        <div className="flex items-center gap-4">
          <img src={mascoteFeliz} alt="" className="size-16 shrink-0 drop-shadow-lg" />
          <p className="text-muted-foreground text-[15px]">
            Você está em dia. Nenhuma parcela em aberto por enquanto.
          </p>
        </div>
      ) : null}

      {proxima ? (
        <div className="grid gap-4">
          <div className="grid gap-1">
            <p className="text-foreground text-3xl leading-none font-medium tracking-tight tabular-nums">
              {formatarCentavos(valorNaLista(proxima))}
            </p>
            <p className="text-muted-foreground text-[15px]">
              {rotuloDoItem(proxima)} {proxima.numero}/{proxima.de} · {prazo(proxima.vencimento)}
            </p>
            <p className="text-texto-muted text-sm tabular-nums">{formatarData(proxima.vencimento)}</p>
          </div>

          <Button asChild size="sm" className="w-fit">
            <Link to={rotaDoPagamento(proxima.id)}>Pagar com PIX</Link>
          </Button>
        </div>
      ) : null}
    </Cartao>
  )
}
