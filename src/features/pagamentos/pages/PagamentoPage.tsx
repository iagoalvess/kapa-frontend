import { CircleCheck, Hourglass, ReceiptText } from 'lucide-react'
import { useParams } from 'react-router'
import mascoteCelular from '@/assets/mascote/celular.webp'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { Cartao } from '@/components/Cartao'
import { ChipDeStatus } from '@/components/ChipDeStatus'
import { EsqueletoDeCartao } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { ROTAS } from '@/config/rotas'
import { formatarCentavos, formatarData } from '@/lib/formato'
import { ehErroDaApi } from '@/lib/http/erros'
import { emAberto, rotuloDoItem, valorNaLista } from '@/types/cobranca'
import { CalculoDoValor, temEncargoOuDesconto } from '../components/CalculoDoValor'
import { ComoPagar } from '../components/ComoPagar'
import { DialogoDeInforme } from '../components/DialogoDeInforme'
import { useCobranca, useMeioEscolhido } from '../hooks/useCobranca'
import { useParcela } from '../hooks/useExtrato'
import type { Parcela } from '../types/pagamentos.types'

/**
 * A cobrança de uma parcela e o "Já paguei" — o caminho de trinta segundos no celular.
 *
 * O valor de hoje abre a tela, grande, e o resto é uma sequência numerada: pagar (1) e avisar a
 * tesouraria (2). No PIX, copiar vem antes e separado do QR, e o nome do titular fica em destaque:
 * é o que o banco vai mostrar, e conferir o nome é o que protege o formando de uma chave trocada.
 * Com mais de um meio habilitado, o passo 1 abre com as pílulas de escolha.
 *
 * A cobrança é montada na hora, com o valor de hoje; não há poll — quem avisa a confirmação é o
 * e-mail.
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

/** O que a data de vencimento significa agora — vazio quando não há o que dizer. */
function notaDoVencimento(parcela: Parcela) {
  if (parcela.em_conferencia && emAberto(parcela)) return 'Você já avisou a tesouraria.'
  if (parcela.status === 'Vencida') return 'Esta parcela está em atraso.'
  if (parcela.status === 'Aberta') return 'Pague até esta data.'
  // Paga, cancelada, renegociada: quem conta o que aconteceu é o cartão de baixo, e repetir aqui
  // deixa a mesma frase duas vezes na tela.
  return undefined
}

/** Quanto se deve hoje, em letra grande, e o vencimento na coluna ao lado. */
function Cabecalho({ parcela }: { parcela: Parcela }) {
  const valor = valorNaLista(parcela)
  const nota = notaDoVencimento(parcela)

  return (
    // Mesma superfície da faixa de indicadores: o topo da tela é sempre a mesma coisa no app.
    <section
      aria-label="Parcela"
      className="bg-card shadow-faixa grid gap-5 rounded-3xl px-5 py-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
    >
      <div className="flex items-center gap-4">
        <span className="bg-brand-tint text-brand-text inline-flex size-14 shrink-0 items-center justify-center rounded-2xl">
          <ReceiptText className="size-7" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="grid min-w-0 gap-1">
          <p className="text-muted-foreground text-sm">
            Parcela {parcela.numero}/{parcela.de}
          </p>
          <p className="text-foreground flex flex-wrap items-center gap-3 text-4xl leading-none font-semibold tracking-tight tabular-nums">
            {formatarCentavos(valor)}
            <ChipDeStatus status={parcela.status} em_conferencia={parcela.em_conferencia} />
          </p>
          <p className="text-muted-foreground text-sm">{rotuloDoItem(parcela)}</p>
        </div>
      </div>

      <div className="grid gap-0.5 md:border-l md:pl-6">
        <p className="text-muted-foreground text-sm">Vencimento</p>
        <p className="text-foreground text-xl font-medium tabular-nums">{formatarData(parcela.vencimento)}</p>
        {nota ? <p className="text-muted-foreground text-sm">{nota}</p> : null}
      </div>
    </section>
  )
}

/** Os dois passos, lado a lado no computador e empilhados no celular. */
function Pagamento({ parcela }: { parcela: Parcela }) {
  const cobranca = useCobranca(parcela.id, true)
  const semConta = ehErroDaApi(cobranca.error) && cobranca.error.codigo === 'pagamento.sem_conta'
  const [escolhido, escolher] = useMeioEscolhido(cobranca.data)

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <ComoPagar
        cobranca={cobranca}
        escolhido={escolhido}
        aoEscolher={escolher}
        descricao="Pague por onde a turma aceita receber, e depois avise a tesouraria."
      />

      <Cartao
        passo={2}
        titulo="Já pagou?"
        descricao="Avise a tesouraria. Ela confere no extrato do banco e confirma — a parcela muda quando ela confirmar."
      >
        {temEncargoOuDesconto(parcela.valor_do_dia) ? (
          <div className="bg-muted grid gap-3 rounded-2xl p-4">
            <p className="text-foreground font-medium">Resumo da parcela</p>
            <CalculoDoValor valor={parcela.valor_do_dia} />
          </div>
        ) : null}

        <DialogoDeInforme
          parcelaIds={[parcela.id]}
          valor_em_centavos={
            cobranca.data?.valor_em_centavos ??
            parcela.valor_do_dia?.total_em_centavos ??
            parcela.valor_original_em_centavos
          }
          meio={escolhido?.meio}
          desabilitado={semConta}
        />
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
