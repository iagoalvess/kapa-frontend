import { Info, ReceiptText } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Cartao } from '@/components/Cartao'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { QrCodePix } from '@/components/QrCodePix'
import { ROTAS } from '@/config/rotas'
import { formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { rotuloDoItem, valorNaLista } from '@/types/cobranca'
import { DialogoDeInforme } from '../components/DialogoDeInforme'
import { useExtrato } from '../hooks/useExtrato'
import { usePixDeVarias } from '../hooks/usePix'

/**
 * O PIX que cobre várias parcelas de uma vez — o formando atrasado se acertando num pagamento só.
 *
 * Mesma sequência da parcela avulsa: o valor grande em cima, copiar a chave (1) e avisar a
 * tesouraria (2). O que muda é a lista do que este PIX cobre, entre o valor e o QR: quem vai pagar
 * R$ 1.470,00 de uma vez precisa ver de onde esse número saiu antes de confirmar no banco.
 *
 * As parcelas vêm da query, escolhidas na tela anterior. Quem monta o BR Code da soma é a API, que
 * também recusa a lista com parcela paga, avisada ou de outro formando — a tela não refaz a conta.
 */
export default function PagamentoEmLotePage() {
  const [parametros] = useSearchParams()
  const ids = (parametros.get('parcelas') ?? '').split(',').filter(Boolean)
  const pix = usePixDeVarias(ids)
  const extrato = useExtrato()
  const semConta = ehErroDaApi(pix.error) && pix.error.codigo === 'pagamento.sem_conta'

  // O nome de cada parcela é do extrato, que a tela anterior já deixou no cache; a ordem é a da API.
  const escolhidas = (extrato.data?.parcelas ?? []).filter((parcela) => ids.includes(parcela.id))

  return (
    <>
      <LinkDeVolta para={ROTAS.extrato}>Meu extrato</LinkDeVolta>

      {/* Mesma superfície da tela da parcela: o topo do app é sempre a mesma coisa. */}
      <section
        aria-label="Pagamento"
        className="bg-card shadow-faixa grid gap-5 rounded-3xl px-5 py-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
      >
        <div className="flex items-center gap-4">
          <span className="bg-brand-tint text-brand-text inline-flex size-14 shrink-0 items-center justify-center rounded-2xl">
            <ReceiptText className="size-7" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="grid min-w-0 gap-1">
            <p className="text-muted-foreground text-sm">
              {formatarNumero(ids.length)} parcelas num pagamento só
            </p>
            <p className="text-foreground text-4xl leading-none font-semibold tracking-tight tabular-nums">
              {pix.data ? formatarCentavos(pix.data.valor_em_centavos) : '—'}
            </p>
            <p className="text-muted-foreground text-sm">Valor de hoje, com multa e juros do atraso.</p>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Cartao
          passo={1}
          titulo="Copie a chave PIX"
          descricao="Cole a chave no app do seu banco. É um pagamento só, com a soma das parcelas."
        >
          {pix.isPending ? (
            <EsqueletoDeCartoes quantidade={1} altura="h-56" className="md:grid-cols-1" />
          ) : null}

          {pix.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {semConta
                ? 'A comissão ainda está configurando a conta de recebimento da turma. Volte em alguns dias.'
                : mensagemDoErro(pix.error)}
            </p>
          ) : null}

          {pix.data ? (
            <div className="motion-safe:animate-entrar grid gap-4">
              <QrCodePix copiaECola={pix.data.copia_e_cola} destaque />
              <p className="text-muted-foreground grid justify-items-center text-sm">
                Para
                <strong className="text-foreground text-base uppercase">{pix.data.nome_do_titular}</strong>
              </p>
              <div className="bg-muted text-muted-foreground flex gap-3 rounded-2xl p-4 text-sm">
                <Info className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} aria-hidden />
                <ul className="grid list-inside list-disc gap-1">
                  <li>Confira se o seu banco mostra este nome antes de confirmar.</li>
                  <li>O valor, {formatarCentavos(pix.data.valor_em_centavos)}, vale para hoje.</li>
                  <li>Pague de uma vez: um PIX pela metade não baixa parcela nenhuma.</li>
                </ul>
              </div>
            </div>
          ) : null}
        </Cartao>

        <Cartao
          passo={2}
          titulo="Já pagou?"
          descricao="Avise a tesouraria. Ela confere no extrato do banco e confirma — as parcelas mudam quando ela confirmar."
        >
          {escolhidas.length > 0 ? (
            <div className="bg-muted grid gap-3 rounded-2xl p-4">
              <p className="text-foreground font-medium">O que este pagamento cobre</p>
              <ul className="grid gap-2 text-sm">
                {escolhidas.map((parcela) => (
                  <li key={parcela.id} className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground min-w-0 truncate">
                      {rotuloDoItem(parcela)} · vence {formatarData(parcela.vencimento)}
                    </span>
                    <span className="text-foreground whitespace-nowrap tabular-nums">
                      {formatarCentavos(valorNaLista(parcela))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <DialogoDeInforme
            parcelaIds={ids}
            valor_em_centavos={pix.data?.valor_em_centavos ?? 0}
            desabilitado={!pix.data}
          />
        </Cartao>
      </div>
    </>
  )
}
