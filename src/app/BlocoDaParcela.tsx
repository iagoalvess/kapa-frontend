import { WalletMinimal } from 'lucide-react'
import mascoteFeliz from '@/assets/mascote/feliz.webp'
import { Dica } from '@/components/Dica'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Button } from '@/components/ui/button'
import { rotaDoPagamento } from '@/config/rotas'
import { useExtrato } from '@/features/pagamentos'
import { diasAte, formatarCentavos, formatarData, primeiraMaiuscula } from '@/lib/formato'
import { emAberto, rotuloDoItem, valorNaLista } from '@/types/cobranca'

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
 * Quem está em dia vê o mascote e uma linha dizendo isso: "nada a pagar" é uma boa notícia que vale a
 * pena dar.
 */
export function BlocoDaParcela() {
  const extrato = useExtrato()
  const proxima = extrato.data?.proxima
  const segundaProxima = (extrato.data?.parcelas ?? [])
    .filter((parcela) => emAberto(parcela) && !parcela.em_conferencia && parcela.id !== proxima?.id)
    .toSorted((a, b) => a.vencimento.localeCompare(b.vencimento))[0]

  if (extrato.isPending) return <EsqueletoDeTexto linhas={2} />
  if (extrato.isError) return <ErroDaConsulta erro={extrato.error} />

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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6">
      <div className="grid gap-4">
        <div className="flex items-center gap-4">
          <WalletMinimal className="text-brand size-8 shrink-0" strokeWidth={1.6} aria-hidden />
          <Dica dica={`${rotuloDoItem(proxima)} ${proxima.numero}/${proxima.de}`}>
            <p className="text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
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
        <aside
          aria-label="Parcela seguinte"
          className="grid gap-1 border-t pt-4 lg:border-t-0 lg:border-l lg:py-2 lg:pl-5"
        >
          <p className="text-muted-foreground text-xs font-medium">
            Depois · {rotuloDoItem(segundaProxima)} {segundaProxima.numero}/{segundaProxima.de}
          </p>
          <p className="text-lg font-bold tabular-nums">{formatarCentavos(valorNaLista(segundaProxima))}</p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {formatarData(segundaProxima.vencimento)}
          </p>
        </aside>
      ) : null}
    </div>
  )
}
