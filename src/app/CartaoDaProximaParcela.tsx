import { WalletMinimal } from 'lucide-react'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import mascoteFeliz from '@/assets/mascote/feliz.webp'
import { Cartao } from '@/components/Cartao'
import { Dica } from '@/components/Dica'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Button } from '@/components/ui/button'
import { ROTAS, rotaDoPagamento } from '@/config/rotas'
import { useExtrato } from '@/features/pagamentos'
import { diasAte, formatarCentavos, formatarData, primeiraMaiuscula } from '@/lib/formato'
import { IconePix } from '@/components/IconePix'
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
 * sendo a tela do assunto (a seta no canto leva a ele); aqui fica só a primeira a pagar, que é a pergunta de
 * quem abriu o app para pagar e não quer procurar. O fundo em tom de laranja é o que a separa da
 * festa ao lado: esta é a ação da pessoa, aquela é o progresso da turma.
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
      para={ROTAS.extrato}
      rotuloDoAtalho="Ver meu extrato"
      className="from-brand-wash to-brand-tint/70 gap-3 bg-linear-to-br"
    >
      {extrato.isError ? <ErroDaConsulta erro={extrato.error} /> : null}
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
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <Dica dica={`${rotuloDoItem(proxima)} ${proxima.numero}/${proxima.de}`}>
              <p className="text-2xl font-bold tracking-tight tabular-nums">
                {formatarCentavos(valorNaLista(proxima))}
              </p>
            </Dica>
            <p className="text-muted-foreground text-sm">
              {primeiraMaiuscula(prazo(proxima.vencimento))}
              <span className="text-brand mx-1.5" aria-hidden>
                •
              </span>
              <span className="tabular-nums">{formatarData(proxima.vencimento)}</span>
            </p>
          </div>

          <Button asChild className="w-full">
            <LinkDaPagina to={rotaDoPagamento(proxima.id)}>
              <IconePix />
              Pagar com PIX
            </LinkDaPagina>
          </Button>
        </>
      ) : null}
    </Cartao>
  )
}
