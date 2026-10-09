import { CreditCard } from 'lucide-react'
import { type ReactNode, useId, useState } from 'react'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { ComoVoceQuerPagar } from '@/components/ComoVoceQuerPagar'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { IconePix } from '@/components/IconePix'
import { formatarCentavos } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import type { MeioDePagamento } from '@/types/pagamento'
import type { Plano } from '@/types/plano'
import { useCheckout } from '../hooks/useCheckout'
import type { CupomAplicavel } from '../types/assinaturas.types'
import { CampoDeCupom, comDesconto } from './CampoDeCupom'

/** A escolha explica também como renovar: cartão automático ou um PIX por ciclo. */
const MEIOS_DO_PLANO = [
  {
    chave: 'Cartao',
    rotulo: 'Cartão de crédito',
    icone: <CreditCard aria-hidden />,
    explicacao: 'Cadastre o cartão uma vez: a cobrança é automática a cada ciclo.',
  },
  {
    chave: 'Pix',
    rotulo: 'PIX',
    icone: <IconePix aria-hidden />,
    explicacao:
      'Um PIX por ciclo. Avisamos por e-mail antes do vencimento, e você paga pela tela da assinatura.',
  },
] as const satisfies { chave: MeioDePagamento; rotulo: string; icone: ReactNode; explicacao: string }[]

/**
 * Prepara a contratação depois da escolha do plano. O total é o ciclo inteiro, inclusive no anual;
 * o desconto vale só na primeira cobrança. Montar novamente reinicia as escolhas ao voltar à vitrine.
 */
export function DialogoDeContratacao({ plano, aoFechar }: { plano: Plano; aoFechar: () => void }) {
  const formularioId = useId()
  const checkout = useCheckout()
  const [meio, definirMeio] = useState<MeioDePagamento>('Cartao')
  const [cupom, definirCupom] = useState<CupomAplicavel | null>(null)
  const [consultandoCupom, definirConsultandoCupom] = useState(false)
  // Sucesso também trava até a navegação ao provedor, evitando duas sessões de checkout.
  const ocupado = checkout.isPending || checkout.isSuccess
  const total = cupom ? comDesconto(plano.preco_em_centavos, cupom.percentual) : plano.preco_em_centavos
  const porCiclo = plano.ciclo === 'Anual' ? 'por ano' : 'por mês'

  function fechar() {
    if (!ocupado) aoFechar()
  }

  return (
    <DialogoDeFormulario
      aberto
      aoFechar={fechar}
      titulo="Finalizar assinatura"
      descricao="Confira o plano e escolha como pagar. Você continuará para a página do Mercado Pago; o Kapa não recebe os dados do seu cartão."
      largura="estreito"
    >
      <div className="grid gap-5">
        <div className="bg-muted grid gap-1 rounded-xl p-4">
          <p className="text-foreground font-semibold">{plano.nome}</p>
          <p className="text-muted-foreground text-sm">
            {plano.ciclo} · {formatarCentavos(plano.preco_em_centavos)} {porCiclo}
          </p>
          {plano.ciclo === 'Anual' ? (
            <p className="text-muted-foreground text-sm">O valor anual é cobrado de uma só vez.</p>
          ) : null}
        </div>

        <fieldset disabled={ocupado} className="grid min-w-0 gap-5">
          <div className="grid gap-2">
            <p className="text-foreground text-sm font-medium">Como você quer pagar?</p>
            <ComoVoceQuerPagar
              opcoes={[...MEIOS_DO_PLANO]}
              escolhida={meio}
              aoEscolher={(chave) => definirMeio(chave === 'Pix' ? 'Pix' : 'Cartao')}
            />
            <p className="text-muted-foreground text-sm text-pretty">
              {MEIOS_DO_PLANO.find((opcao) => opcao.chave === meio)?.explicacao}
            </p>
          </div>

          <CampoDeCupom aplicado={cupom} aoAplicar={definirCupom} aoMudarConsulta={definirConsultandoCupom} />
        </fieldset>

        <div className="border-border grid gap-2 border-t pt-4" aria-live="polite" aria-atomic="true">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-foreground text-sm font-medium">Primeira cobrança</p>
            <p className="text-foreground text-2xl font-semibold tabular-nums">
              {cupom ? (
                <s className="text-texto-muted mr-2 text-sm font-normal">
                  {formatarCentavos(plano.preco_em_centavos)}
                </s>
              ) : null}
              {formatarCentavos(total)}
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            {cupom ? 'Da segunda cobrança em diante: ' : 'Renovação: '}
            {formatarCentavos(plano.preco_em_centavos)} {porCiclo}.
          </p>
        </div>

        {/* O cupom tem seu próprio envio: o checkout é outro formulário, sem forms aninhados. */}
        <form
          id={formularioId}
          className="hidden"
          onSubmit={(evento) => {
            evento.preventDefault()
            if (ocupado || consultandoCupom) return
            checkout.mutate(
              { planoCodigo: plano.codigo, meio, cupomCodigo: cupom?.codigo },
              { onError: avisarErro },
            )
          }}
        />
        <AcoesDoFormulario
          form={formularioId}
          aoCancelar={fechar}
          ocupado={ocupado}
          desabilitado={consultandoCupom}
          rotuloDeCancelar="Voltar aos planos"
          rotulo="Continuar para pagamento"
          rotuloOcupado="Indo para o pagamento…"
          rotulosEmMultilinha
        />
      </div>
    </DialogoDeFormulario>
  )
}
