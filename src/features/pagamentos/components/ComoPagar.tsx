import { Copy, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { Chip } from '@/components/Chip'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { QrCodePix } from '@/components/QrCodePix'
import { Button } from '@/components/ui/button'
import { formatarCentavos } from '@/lib/formato'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { MEIOS } from '@/types/recebimento'
import type { CobrancaDaParcela, MeioDaCobranca } from '../types/pagamentos.types'

interface Props {
  /** A consulta da cobrança, como o hook a devolve. */
  cobranca: { data?: CobrancaDaParcela; isPending: boolean; isError: boolean; error: Error | null }
  /** O meio que a pessoa está vendo agora. */
  escolhido?: MeioDaCobranca
  /** Trocar de meio. */
  aoEscolher: (meio: MeioDaCobranca) => void
  /** O que o passo 1 diz embaixo do título, conforme a tela seja de uma parcela ou de várias. */
  descricao: string
  /** Avisos extras do PIX — o lote acrescenta o "pague de uma vez". */
  avisos?: ReactNode
}

/**
 * O passo 1 das duas telas de pagamento: por onde pagar, e o que cada meio precisa mostrar.
 *
 * Com um meio só não há seletor — a tela é a de sempre, no mesmo número de cliques (decisão 3 da
 * Sprint 18). Com dois ou mais, os meios viram pílulas acima do conteúdo, e o escolhido desenha o
 * que é dele: o QR e o copia-e-cola no PIX, os dados da conta na transferência, a instrução em
 * dinheiro e no combinado.
 *
 * A parcela avulsa e o lote compartilham este cartão: a diferença entre as duas telas é o que se
 * cobra, não como se paga.
 */
export function ComoPagar({ cobranca, escolhido, aoEscolher, descricao, avisos }: Props) {
  const semConta = ehErroDaApi(cobranca.error) && cobranca.error.codigo === 'pagamento.sem_conta'
  const meios = cobranca.data?.meios ?? []

  return (
    <Cartao passo={1} titulo="Como pagar" descricao={descricao}>
      {cobranca.isPending ? (
        <EsqueletoDeCartoes quantidade={1} altura="h-56" className="md:grid-cols-1" />
      ) : null}

      {cobranca.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {semConta
            ? 'A comissão ainda está configurando a conta de recebimento da turma. Volte em alguns dias.'
            : mensagemDoErro(cobranca.error)}
        </p>
      ) : null}

      {escolhido ? (
        <div className="motion-safe:animate-entrar grid gap-4">
          {meios.length > 1 ? (
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">Como você quer pagar</legend>
              {meios.map((meio) => (
                <Chip key={meio.meio} ativo={meio.meio === escolhido.meio} onClick={() => aoEscolher(meio)}>
                  {MEIOS[meio.meio].rotulo}
                </Chip>
              ))}
            </fieldset>
          ) : null}

          <Detalhe meio={escolhido} valorEmCentavos={cobranca.data!.valor_em_centavos} avisos={avisos} />
        </div>
      ) : null}
    </Cartao>
  )
}

/** O corpo do meio escolhido. Cada um mostra o que é dele, e nada do que é dos outros. */
function Detalhe({
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
        <QrCodePix copiaECola={meio.pix.copia_e_cola} destaque />
        <p className="text-muted-foreground grid justify-items-center text-sm">
          Para
          <strong className="text-foreground text-base uppercase">{meio.pix.nome_do_titular}</strong>
        </p>
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
    <div className="flex items-center justify-between gap-3">
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
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor)
      toast.success(`${rotulo} copiada.`)
    } catch {
      toast.warning('Não deu para copiar. Selecione o texto e copie manualmente.')
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7"
      aria-label={`Copiar ${rotulo.toLowerCase()}`}
      onClick={copiar}
    >
      <Copy className="size-3.5" aria-hidden />
    </Button>
  )
}
