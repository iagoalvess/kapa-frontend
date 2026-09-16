import { CircleCheck, Hourglass, QrCode, Send } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import mascoteCelular from '@/assets/mascote/celular.webp'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { Cartao } from '@/components/Cartao'
import { ChipDeStatus } from '@/components/ChipDeStatus'
import { EsqueletoDeCartao, EsqueletoDeCartoes } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { QrCodePix } from '@/components/QrCodePix'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { formatarCentavos, formatarData } from '@/lib/formato'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { emAberto, rotuloDoItem } from '@/types/cobranca'
import { CalculoDoValor, temEncargoOuDesconto } from '../components/CalculoDoValor'
import { FormularioDeInforme } from '../components/FormularioDeInforme'
import { useParcela } from '../hooks/useExtrato'
import { usePix } from '../hooks/usePix'
import type { Parcela } from '../types/pagamentos.types'

/**
 * O PIX de uma parcela e o "Já paguei" — o caminho de trinta segundos no celular.
 *
 * O botão de copiar vem acima do QR, e o nome do titular em destaque: é o que o banco vai mostrar, e
 * conferir o nome é o que protege o formando de uma chave trocada. O PIX é montado na hora, com o
 * valor de hoje; não há poll — quem avisa a confirmação é o e-mail.
 */
export default function PagamentoPage() {
  const { id = '' } = useParams()
  const parcela = useParcela(id)
  const pagavel = parcela.data !== undefined && emAberto(parcela.data) && !parcela.data.em_conferencia

  return (
    <>
      <LinkDeVolta para={ROTAS.extrato}>Meu extrato</LinkDeVolta>

      {parcela.isPending ? <EsqueletoDeCartao /> : null}

      {parcela.isError ? <ErroDaConsulta erro={parcela.error} /> : null}

      {parcela.data ? (
        <>
          <Cabecalho parcela={parcela.data} />
          {pagavel ? <Pagamento parcela={parcela.data} /> : <Situacao parcela={parcela.data} />}
        </>
      ) : null}
    </>
  )
}

/** Quanto, qual parcela e em que situação — como o cabeçalho de detalhe dos modelos. */
function Cabecalho({ parcela }: { parcela: Parcela }) {
  const valor =
    parcela.valor_pago_em_centavos ??
    parcela.valor_do_dia?.total_em_centavos ??
    parcela.valor_original_em_centavos

  return (
    <section aria-label="Parcela" className="bg-card shadow-cartao grid gap-1 rounded-3xl p-5">
      <p className="text-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-medium tracking-tight tabular-nums">
        {formatarCentavos(valor)}
        <span className="text-muted-foreground text-base font-normal">
          · parcela {parcela.numero}/{parcela.de}
        </span>
        <ChipDeStatus status={parcela.status} em_conferencia={parcela.em_conferencia} />
      </p>
      <p className="text-muted-foreground text-sm">
        {rotuloDoItem(parcela)}, vencimento em {formatarData(parcela.vencimento)}
      </p>
    </section>
  )
}

/** O QR e o "Já paguei", lado a lado no computador e empilhados no celular. */
function Pagamento({ parcela }: { parcela: Parcela }) {
  const pix = usePix(parcela.id, true)
  const [informando, definirInformando] = useState(false)
  const semConta = ehErroDaApi(pix.error) && pix.error.codigo === 'pagamento.sem_conta'

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Cartao titulo="Pague pelo PIX" icone={QrCode} descricao="Copie o código e cole no app do seu banco.">
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
            <p className="text-muted-foreground text-sm">
              Para{' '}
              <strong className="text-foreground block text-base uppercase">
                {pix.data.nome_do_titular}
              </strong>
            </p>
            <QrCodePix copiaECola={pix.data.copia_e_cola} destaque />
            <ul className="text-muted-foreground grid list-inside list-disc gap-1 text-sm">
              <li>Confira se o seu banco mostra este nome antes de confirmar.</li>
              <li>O valor, {formatarCentavos(pix.data.valor_em_centavos)}, vale para hoje.</li>
            </ul>
          </div>
        ) : null}
      </Cartao>

      <Cartao
        titulo="Já pagou?"
        icone={Send}
        descricao="Avise a tesouraria. Ela confere no extrato do banco e confirma — a parcela muda quando ela confirmar."
      >
        {temEncargoOuDesconto(parcela.valor_do_dia) ? (
          <div className="bg-muted rounded-lg p-3">
            <CalculoDoValor valor={parcela.valor_do_dia} />
          </div>
        ) : null}

        {informando ? (
          <FormularioDeInforme
            parcelaId={parcela.id}
            valor_em_centavos={
              pix.data?.valor_em_centavos ??
              parcela.valor_do_dia?.total_em_centavos ??
              parcela.valor_original_em_centavos
            }
            aoConcluir={() => definirInformando(false)}
            aoCancelar={() => definirInformando(false)}
          />
        ) : (
          <Button
            size="lg"
            className="w-full sm:w-fit"
            disabled={semConta}
            onClick={() => definirInformando(true)}
          >
            Já paguei
          </Button>
        )}
      </Cartao>
    </div>
  )
}

/** A parcela que não se paga por aqui: já paga, em conferência, cancelada. */
function Situacao({ parcela }: { parcela: Parcela }) {
  if (parcela.em_conferencia)
    return (
      <Cartao titulo="Pagamento avisado" icone={Hourglass}>
        {/* Espera sem retorno imediato: a conferência é em lote, e a tela ficava só com o texto. */}
        <div className="flex items-center gap-4">
          <img src={mascoteCelular} alt="" className="w-16 shrink-0 drop-shadow-lg" />
          <output className="text-muted-foreground text-sm">
            Avisamos a tesouraria. Você recebe um e-mail quando o pagamento for confirmado.
          </output>
        </div>
      </Cartao>
    )

  if (parcela.status === 'Paga')
    return (
      <Cartao titulo="Parcela paga" icone={CircleCheck}>
        <p className="text-muted-foreground text-sm">
          A tesouraria confirmou {formatarCentavos(parcela.valor_pago_em_centavos)}, pago em{' '}
          {formatarData(parcela.pago_em)}.
        </p>
      </Cartao>
    )

  return (
    <Cartao titulo="Nada a pagar" icone={CircleCheck}>
      <p className="text-muted-foreground text-sm">Esta parcela não está mais em aberto.</p>
    </Cartao>
  )
}
