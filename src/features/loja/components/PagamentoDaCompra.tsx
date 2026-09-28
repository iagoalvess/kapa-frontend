import { QrCodePix } from '@/components/QrCodePix'
import { Button } from '@/components/ui/button'
import { formatarCentavos, formatarDataHora, instanteDe } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { useGerarCobranca } from '../hooks/useLoja'
import type { Compra } from '../types/loja.types'
import { ContagemRegressiva, useAgoraDoServidor } from './ContagemRegressiva'

/**
 * A compra reservada esperando o pagamento: o PIX, e até quando a reserva vale.
 *
 * Sem documento — o Mercado Pago falhou na hora da compra —, a tela oferece gerar de novo.
 *
 * @param token O segredo do link.
 * @param compra A compra pendente.
 */
export function PagamentoDaCompra({ token, compra }: { token: string; compra: Compra }) {
  const gerar = useGerarCobranca(token)
  // A reserva é contada pelo relógio do aparelho: aqui não há decisão, só aviso, e a API decide a expiração.
  const agora = useAgoraDoServidor(0)
  const { cobranca } = compra
  // O PIX vence um pouco antes da reserva (decisão 9): com ele na tela, o prazo que importa é o dele.
  const prazo = cobranca?.meio === 'Pix' ? cobranca.expira_em : compra.expira_em

  return (
    <section aria-labelledby="titulo-do-pagamento" className="grid gap-4">
      <div className="grid gap-1 text-center">
        <h2 id="titulo-do-pagamento" className="text-lg font-semibold">
          Pague {formatarCentavos(compra.valor_em_centavos)} para garantir{' '}
          {compra.quantidade === 1 ? 'o convite' : 'os convites'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {instanteDe(prazo) > agora ? (
            <>
              {prazo === compra.expira_em ? 'Reserva até' : 'Pague até'} {formatarDataHora(prazo)} ·{' '}
              <ContagemRegressiva ate={prazo} agora={agora} prefixo="faltam" />
            </>
          ) : (
            'A reserva está no fim. Se você já pagou, a confirmação chega em instantes.'
          )}
        </p>
      </div>

      {cobranca === null ? (
        <div className="bg-muted grid justify-items-center gap-3 rounded-2xl p-4 text-center">
          <p className="text-sm">
            O pagamento não foi gerado. Tente de novo — a sua reserva continua valendo.
          </p>
          <Button disabled={gerar.isPending} onClick={() => gerar.mutate(undefined, { onError: avisarErro })}>
            {gerar.isPending ? 'Gerando…' : 'Gerar pagamento'}
          </Button>
        </div>
      ) : cobranca.copia_e_cola ? (
        <QrCodePix copiaECola={cobranca.copia_e_cola} destaque />
      ) : null}

      <p className="text-muted-foreground text-center text-xs">
        A confirmação é automática: esta página muda sozinha quando o pagamento cair, e o link dos convites
        também chega por e-mail.
      </p>
    </section>
  )
}
