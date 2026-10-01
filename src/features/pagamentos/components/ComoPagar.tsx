import { Copy, CreditCard, Info, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { ComoVoceQuerPagar } from '@/components/ComoVoceQuerPagar'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { FormularioDeCartao } from '@/components/FormularioDeCartao'
import { IconePix } from '@/components/IconePix'
import { QrCodePix } from '@/components/QrCodePix'
import { Button } from '@/components/ui/button'
import { copiar } from '@/lib/copiar'
import { formatarCentavos } from '@/lib/formato'
import { avisarErro, ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import type { CartaoParaPagar } from '@/types/pagamento'
import { type OpcaoDaCobranca, opcoesDaCobranca, usePagarNoCartao } from '../hooks/useCobranca'
import type { CobrancaDaParcela, MeioDaCobranca, PeloMercadoPago } from '../types/pagamentos.types'
import { DadosDoRecebedor } from './DadosDoRecebedor'

interface Props {
  /** A consulta da cobrança, como o hook a devolve. */
  cobranca: { data?: CobrancaDaParcela; isPending: boolean; isError: boolean; error: Error | null }
  /** A opção que a pessoa está vendo agora. */
  escolhido?: OpcaoDaCobranca
  /** Trocar de opção, pela chave. */
  aoEscolher: (chave: string) => void
  /** O que o passo 1 diz embaixo do título, conforme a tela seja de uma parcela ou de várias. */
  descricao: string
  /** Avisos extras do PIX — o lote acrescenta o "pague de uma vez". */
  avisos?: ReactNode
  /** As parcelas que o pagamento cobre — o cartão paga por elas (Sprint 39). */
  parcelaIds: string[]
}

/**
 * O passo 1 das duas telas de pagamento: por onde pagar, e o que cada meio precisa mostrar.
 *
 * Com um meio só não há seletor — a tela é a de sempre, no mesmo número de cliques (decisão 3 da
 * Sprint 18). Com dois ou mais, os meios viram pílulas acima do conteúdo (`ComoVoceQuerPagar`), e o
 * escolhido desenha o que é dele: quem recebe, o QR e o copia-e-cola no PIX, os dados da conta na
 * transferência, a instrução em dinheiro.
 *
 * A parcela avulsa e o lote compartilham este cartão: a diferença entre as duas telas é o que se
 * cobra, não como se paga.
 *
 * Com o Mercado Pago da turma conectado (Sprint 25), os meios dele vêm primeiro: baixam a parcela
 * sozinhos, e a tela diz isso no lugar do "avise depois".
 */
export function ComoPagar({ cobranca, escolhido, aoEscolher, descricao, avisos, parcelaIds }: Props) {
  const semConta = ehErroDaApi(cobranca.error) && cobranca.error.codigo === 'pagamento.sem_conta'
  const opcoes = opcoesDaCobranca(cobranca.data)

  return (
    <Cartao passo={1} titulo="Como pagar" descricao={descricao}>
      {cobranca.isPending ? (
        <EsqueletoDeCartoes quantidade={1} altura="h-56" className="md:grid-cols-1" />
      ) : null}

      {cobranca.isError ? (
        <p role="alert" className="text-danger-text text-sm">
          {semConta
            ? 'A comissão ainda está configurando como a turma receberá pagamentos. Tente novamente mais tarde.'
            : mensagemDoErro(cobranca.error)}
        </p>
      ) : null}

      {escolhido ? (
        <div className="motion-safe:animate-entrar grid gap-4">
          <ComoVoceQuerPagar
            opcoes={opcoes.map((opcao) => ({
              chave: opcao.chave,
              rotulo: opcao.rotulo,
              icone: IconeDoMeio((opcao.mercadoPago ?? opcao.comissao).meio),
            }))}
            escolhida={escolhido.chave}
            aoEscolher={aoEscolher}
          />

          {escolhido.mercadoPago ? (
            <DoMercadoPago
              meio={escolhido.mercadoPago}
              valorEmCentavos={cobranca.data!.valor_em_centavos}
              avisos={avisos}
              parcelaIds={parcelaIds}
            />
          ) : (
            <DaComissao
              meio={escolhido.comissao}
              valorEmCentavos={cobranca.data!.valor_em_centavos}
              avisos={avisos}
            />
          )}
        </div>
      ) : null}
    </Cartao>
  )
}

/** O ícone da pílula: o PIX e o cartão têm; os demais meios, não. */
function IconeDoMeio(meio: string) {
  if (meio === 'Pix') return <IconePix className="size-3.5" />
  if (meio === 'Cartao') return <CreditCard className="size-3.5" aria-hidden />
  return null
}

/** O meio do Mercado Pago da turma: o QR ou o formulário do cartão, e o aviso de que não há o que avisar. */
function DoMercadoPago({
  meio,
  valorEmCentavos,
  avisos,
  parcelaIds,
}: {
  meio: PeloMercadoPago
  valorEmCentavos: number
  avisos?: ReactNode
  parcelaIds: string[]
}) {
  if (meio.cartao) return <NoCartao cartao={meio.cartao} parcelaIds={parcelaIds} />

  if (!meio.pix) return null

  return (
    <div className="grid gap-4">
      <SeloDeAutomatico />
      <QrCodePix copiaECola={meio.pix.copia_e_cola} destaque />
      <Avisos>
        <li>Quem recebe é a conta Mercado Pago da turma — é o nome que o seu banco vai mostrar.</li>
        <li>O valor, {formatarCentavos(valorEmCentavos)}, vale até o fim de hoje.</li>
        <li>Não precisa avisar ninguém: a parcela muda para paga sozinha, em instantes.</li>
        {avisos}
      </Avisos>
    </div>
  )
}

/**
 * O cartão da turma (Sprint 39): o formulário do Mercado Pago e, aprovado, a parcela paga na hora. Em análise, a
 * tela espera o aviso do Mercado Pago como no PIX.
 */
function NoCartao({ cartao, parcelaIds }: { cartao: CartaoParaPagar; parcelaIds: string[] }) {
  const pagar = usePagarNoCartao()

  return (
    <div className="grid gap-4">
      <SeloDeAutomatico />
      <FormularioDeCartao
        cartao={cartao}
        aoPagar={async (dados) => {
          try {
            const { situacao } = await pagar.mutateAsync({
              parcelaIds,
              cartao: dados,
              valorEmCentavos: cartao.valor_em_centavos,
            })
            if (situacao === 'Pago') toast.success('Pagamento aprovado no cartão.')
            else
              toast.info(
                'O Mercado Pago está analisando o pagamento. A parcela muda sozinha quando ele decidir.',
              )
          } catch (erro) {
            avisarErro(erro)
            throw erro
          }
        }}
      />
    </div>
  )
}

/** O meio da conta da comissão. Cada um mostra o que é dele, e nada do que é dos outros. */
function DaComissao({
  meio,
  valorEmCentavos,
  avisos,
}: {
  meio: MeioDaCobranca
  valorEmCentavos: number
  avisos?: ReactNode
}) {
  if (meio.pix)
    return (
      <div className="grid gap-4">
        <DadosDoRecebedor pix={meio.pix} />
        <QrCodePix copiaECola={meio.pix.copia_e_cola} destaque />
        <Avisos>
          <li>Confira se o seu banco mostra este nome antes de confirmar.</li>
          <li>O valor, {formatarCentavos(valorEmCentavos)}, vale para hoje.</li>
          {avisos}
        </Avisos>
      </div>
    )

  if (meio.transferencia) {
    const { banco, agencia, conta, tipo_de_conta, titular } = meio.transferencia

    return (
      <div className="grid gap-4">
        <dl className="bg-muted grid gap-3 rounded-2xl p-4 text-sm">
          <Linha rotulo="Banco" valor={banco} />
          <Linha rotulo="Agência" valor={agencia} copiavel />
          <Linha rotulo="Conta" valor={conta} copiavel />
          <Linha rotulo="Tipo" valor={tipo_de_conta} />
          <Linha rotulo="Titular" valor={titular} />
        </dl>
        <Avisos>
          <li>Transfira {formatarCentavos(valorEmCentavos)} — o valor vale para hoje.</li>
          <li>Guarde o comprovante: ele ajuda a tesouraria a achar o seu pagamento.</li>
          {avisos}
        </Avisos>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <p className="bg-muted text-foreground rounded-2xl p-4 text-[15px] whitespace-pre-line">
        {meio.instrucao}
      </p>
      <Avisos>
        <li>São {formatarCentavos(valorEmCentavos)} — o valor vale para hoje.</li>
        <li>Depois de pagar, avise a tesouraria no passo 2.</li>
        {avisos}
      </Avisos>
    </div>
  )
}

/** O selo dos meios do Mercado Pago: o que muda para o formando é não precisar avisar. */
function SeloDeAutomatico() {
  return (
    <p className="bg-brand-tint text-brand-text flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium">
      <Zap className="size-4 shrink-0" aria-hidden />
      Confirmação automática pelo Mercado Pago da turma.
    </p>
  )
}

/** A caixa cinza de observações, igual em todos os meios. */
function Avisos({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted text-muted-foreground flex gap-3 rounded-2xl p-4 text-sm">
      <Info className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} aria-hidden />
      <ul className="grid list-inside list-disc gap-1">{children}</ul>
    </div>
  )
}

/** Uma linha dos dados bancários, com o botão de copiar no que se digita no app do banco. */
function Linha({ rotulo, valor, copiavel }: { rotulo: string; valor: string; copiavel?: boolean }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <dt className="text-muted-foreground shrink-0">{rotulo}</dt>
      <dd className="text-foreground flex min-w-0 items-center gap-1 font-medium">
        <span className="truncate">{valor}</span>
        {copiavel ? <BotaoDeCopiar rotulo={rotulo} valor={valor} /> : null}
      </dd>
    </div>
  )
}

/** Copiar um campo solto — a agência e a conta são o que se digita errado no app do banco. */
function BotaoDeCopiar({ rotulo, valor }: { rotulo: string; valor: string }) {
  const copiarValor = async () => {
    if (await copiar(valor)) toast.success(`${rotulo} copiada.`)
    else toast.warning('Não deu para copiar. Selecione o texto e copie manualmente.')
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7"
      aria-label={`Copiar ${rotulo.toLowerCase()}`}
      onClick={copiarValor}
    >
      <Copy className="size-3.5" aria-hidden />
    </Button>
  )
}
