import { WalletMinimal } from 'lucide-react'
import mascoteFeliz from '@/assets/mascote/feliz.webp'
import { Dica } from '@/components/Dica'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Button } from '@/components/ui/button'
import { rotaDoPagamento } from '@/config/rotas'
import { useProximasParcelas } from '@/features/pagamentos'
import { diasAte, formatarCentavos, formatarData, primeiraMaiuscula } from '@/lib/formato'
import { rotuloDoItem, valorNaLista } from '@/types/cobranca'
import { TracoDoInicio } from './TracoDoInicio'

/**
 * Quanto tempo a parcela tem, dito como se fala.
 *
 * O dia exato fica logo abaixo: aqui é a urgência, que é o que decide se a pessoa paga agora ou fecha
 * a aba.
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
 * A próxima parcela do próprio formando, com atalho para pagar e um resumo compacto da seguinte.
 *
 * As duas vêm prontas de `/extrato/eu/proximas`: o extrato inteiro fica para Minhas parcelas.
 *
 * Quem está em dia vê o mascote e uma linha dizendo isso: "nada a pagar" é uma boa notícia que vale a
 * pena dar.
 */
export function BlocoDaParcela() {
  const proximas = useProximasParcelas()
  const proxima = proximas.data?.proxima
  const segundaProxima = proximas.data?.seguinte

  if (proximas.isPending) return <EsqueletoDeTexto linhas={2} />
  if (proximas.isError)
    return <ErroDaConsulta compacto erro={proximas.error} aoTentarDeNovo={() => void proximas.refetch()} />

  if (!proxima)
    return (
      <div className="flex items-center gap-4">
        <img src={mascoteFeliz} alt="" className="size-14 shrink-0 drop-shadow-lg" loading="lazy" />
        <p className="text-muted-foreground text-[15px]">
          Você está em dia. Nenhuma parcela em aberto por enquanto.
        </p>
      </div>
    )

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.62fr)_1rem_minmax(0,1fr)] lg:items-center lg:gap-3">
      <div className="grid gap-4">
        <div className="flex items-center gap-4">
          <WalletMinimal className="text-brand size-8 shrink-0" strokeWidth={1.6} aria-hidden />
          <Dica dica={`${rotuloDoItem(proxima)} ${proxima.numero}/${proxima.de}`}>
            <p className="text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl lg:text-4xl 2xl:text-5xl">
              {formatarCentavos(valorNaLista(proxima))}
            </p>
          </Dica>
        </div>

        <p className="text-muted-foreground text-[15px]">
          <span className="text-foreground font-semibold">
            {primeiraMaiuscula(prazo(proxima.vencimento))}
          </span>
          <span className="text-brand mx-2" aria-hidden>
            ·
          </span>
          <span className="tabular-nums">{formatarData(proxima.vencimento)}</span>
        </p>

        <div>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <LinkDaPagina to={rotaDoPagamento(proxima.id)}>
              <WalletMinimal />
              Pagar parcela
            </LinkDaPagina>
          </Button>
        </div>
      </div>

      {segundaProxima ? (
        <>
          <TracoDoInicio
            verticalNoDesktop
            className="col-span-full -my-2 h-4 w-full lg:col-span-1 lg:my-2 lg:h-auto lg:w-3 lg:self-stretch"
          />
          <aside aria-label="Parcela seguinte" className="grid gap-1 py-1">
            <p className="text-muted-foreground text-xs font-medium">
              Depois · {rotuloDoItem(segundaProxima)} {segundaProxima.numero}/{segundaProxima.de}
            </p>
            <p className="text-lg font-bold tabular-nums">{formatarCentavos(valorNaLista(segundaProxima))}</p>
            <p className="text-muted-foreground text-xs tabular-nums">
              {formatarData(segundaProxima.vencimento)}
            </p>
          </aside>
        </>
      ) : null}
    </div>
  )
}
