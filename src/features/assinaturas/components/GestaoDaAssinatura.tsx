import { CreditCard, QrCode, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { AcaoComConfirmacao, AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { Dica } from '@/components/Dica'
import { DialogoDeTexto } from '@/components/DialogoDeTexto'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { usePapel } from '@/hooks/useSessao'
import { formatarData } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { MEIOS_DE_PAGAMENTO } from '@/types/pagamento'
import { useCancelarAssinatura, useSolicitarReembolso, useTrocarMeio } from '../hooks/useAssinatura'
import { usePagarCiclo } from '../hooks/useCheckout'
import type { Assinatura } from '../types/assinaturas.types'
import { SeloDeStatus } from './SeloDeStatus'

const esquemaDeReembolso = z.object({
  motivo: z.string().trim().min(1, 'Informe o motivo do pedido.').max(2000, 'Use até 2.000 caracteres.'),
})

/** Resumo discreto abaixo dos planos; as ações ficam no canto direito e as explicações, nos diálogos. */
export function GestaoDaAssinatura({ assinatura }: { assinatura: Assinatura }) {
  const { ehPresidente } = usePapel()
  const ativa = assinatura.status === 'Ativa'
  const pedido = assinatura.pedido_de_reembolso
  return (
    <section aria-label="Gestão da assinatura" className="border-border grid gap-3 border-t py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-foreground text-sm font-medium">Sua assinatura</h2>
            <SeloDeStatus status={assinatura.status} />
          </div>
          <p className="text-muted-foreground text-xs">
            {assinatura.plano.nome} · {MEIOS_DE_PAGAMENTO[assinatura.meio].rotulo}
            {assinatura.vigente_ate ? ` · Vigente até ${formatarData(assinatura.vigente_ate)}` : ''}
          </p>
        </div>
        {ehPresidente ? (
          <AcoesDaLinha rotulo="Ações da assinatura" className="shrink-0">
            {ativa ? <TrocarPagamento assinatura={assinatura} /> : null}
            {ativa && assinatura.meio === 'Pix' ? (
              <PagarRenovacao vigenteAte={assinatura.vigente_ate} />
            ) : null}
            {assinatura.desistencia_ate && !pedido ? (
              <SolicitarReembolso ate={assinatura.desistencia_ate} />
            ) : null}
            {ativa ? <CancelarRenovacao vigenteAte={assinatura.vigente_ate} /> : null}
          </AcoesDaLinha>
        ) : null}
      </div>
      {assinatura.cartao_aguardando_autorizacao ? (
        <p className="text-muted-foreground text-xs">
          O cartão aguarda autorização. Até lá, a renovação continua pelo PIX.
        </p>
      ) : null}
      {assinatura.status === 'Cancelada' ? (
        <p className="text-muted-foreground text-xs">
          A renovação foi cancelada. O acesso continua até o fim do período pago.
        </p>
      ) : null}
      {assinatura.status === 'Vencida' ? (
        <p className="text-muted-foreground text-xs">
          O plano venceu. Escolha um dos planos acima para contratar novamente.
        </p>
      ) : null}
      {ehPresidente && pedido ? (
        <p className="text-muted-foreground text-xs">
          Reembolso{' '}
          {pedido.status === 'Pendente'
            ? 'em análise'
            : pedido.status === 'Concluido'
              ? 'concluído'
              : 'recusado'}
          . Pedido enviado em {formatarData(pedido.solicitado_em)}.
          <span className="block">Protocolo: {pedido.id}.</span>
        </p>
      ) : null}
    </section>
  )
}

/** A troca explica o fim da recorrência ou a autorização do cartão antes de chamar a API. */
function TrocarPagamento({ assinatura }: { assinatura: Assinatura }) {
  const trocar = useTrocarMeio()
  const paraOPix = assinatura.meio === 'Cartao'
  const vencimento = formatarData(assinatura.vigente_ate)
  if (assinatura.cartao_aguardando_autorizacao)
    return (
      <AcaoDaLinha
        rotulo="Autorizar cartão"
        icone={CreditCard}
        desabilitada={trocar.isPending}
        onClick={() => trocar.mutate('Cartao', { onError: avisarErro })}
      />
    )
  return (
    <AcaoComConfirmacao
      rotulo={paraOPix ? 'Trocar para o PIX' : 'Trocar para o cartão'}
      icone={CreditCard}
      tom="neutra"
      desabilitada={trocar.isPending}
      confirmacao={{
        titulo: paraOPix ? 'Trocar para o PIX?' : 'Trocar para o cartão?',
        descricao: paraOPix
          ? `O débito automático no cartão é cancelado agora. A partir da renovação de ${vencimento}, você paga um PIX por ciclo pela tela dos planos.`
          : `Você vai à página do Mercado Pago cadastrar o cartão. A primeira cobrança é em ${vencimento}, e até lá nada muda.`,
        rotulo: paraOPix ? 'Trocar para o PIX' : 'Ir para o cartão',
        aoConfirmar: () =>
          trocar.mutate(paraOPix ? 'Pix' : 'Cartao', {
            onSuccess: ({ url }) => {
              if (!url) toast.success('A renovação agora é pelo PIX.')
            },
            onError: avisarErro,
          }),
      }}
    />
  )
}

/** A renovação pelo PIX mantém sua porta nos planos, com o prazo explicado no diálogo. */
function PagarRenovacao({ vigenteAte }: { vigenteAte: string | null }) {
  const pagar = usePagarCiclo()
  return (
    <AcaoComConfirmacao
      rotulo="Pagar renovação"
      icone={QrCode}
      tom="neutra"
      desabilitada={pagar.isPending || pagar.isSuccess}
      confirmacao={{
        titulo: 'Pagar a renovação pelo PIX?',
        descricao: `O PIX fica disponível sete dias antes de ${formatarData(vigenteAte)}. Você paga na página do Mercado Pago, e a vigência se estende quando o pagamento confirmar.`,
        rotulo: 'Pagar renovação',
        aoConfirmar: () => pagar.mutate(undefined, { onError: avisarErro }),
      }}
    />
  )
}

/** O motivo acompanha o pedido; o envio registra para análise manual sem alterar a assinatura. */
function SolicitarReembolso({ ate }: { ate: string }) {
  const solicitar = useSolicitarReembolso()
  return (
    <DialogoDeTexto
      gatilho="Solicitar reembolso"
      gatilhoIcone={{ icone: RotateCcw }}
      titulo="Solicitar reembolso"
      descricao={`Até ${formatarData(ate)}, você pode solicitar o reembolso do último pagamento, considerando o desconto de cupom quando houver. Conte o motivo para a equipe analisar o pedido. O envio registra a solicitação; a assinatura e a renovação continuam como estão até a análise. Para interromper as próximas cobranças, use Cancelar renovação.`}
      campo="motivo"
      rotulo="Motivo do pedido"
      esquema={esquemaDeReembolso}
      confirmar="Enviar pedido"
      confirmarOcupado="Enviando…"
      ocupado={solicitar.isPending}
      desabilitado={solicitar.isPending}
      aoEnviar={(motivo, concluir, falhar) =>
        solicitar.mutate(motivo, {
          onSuccess: () => {
            toast.success('Pedido de reembolso enviado para análise.')
            concluir()
          },
          onError: falhar,
        })
      }
    />
  )
}

/**
 * Cancelamento em duas etapas.
 *
 * A primeira diz, em texto claro, até quando o acesso continua e o que acontece depois (modo
 * leitura, nada apagado); só a segunda cancela. Cancelar sem essa informação é o caminho mais curto
 * para um pedido de estorno.
 */
function CancelarRenovacao({ vigenteAte }: { vigenteAte: string | null }) {
  const cancelar = useCancelarAssinatura()
  const [confirmando, definirConfirmando] = useState(false)
  const ate = formatarData(vigenteAte)

  return (
    <AlertDialog onOpenChange={(aberto) => (aberto ? null : definirConfirmando(false))}>
      <AlertDialogTrigger asChild>
        <Dica dica="Cancelar renovação">
          <Button
            aria-label="Cancelar renovação"
            data-rotulo="Cancelar renovação"
            variant="ghost"
            size="icon"
            className="text-danger-text hover:bg-danger-bg h-9 min-w-10 rounded-none in-data-[menu]:h-12 in-data-[menu]:w-full in-data-[menu]:justify-start in-data-[menu]:gap-3 in-data-[menu]:px-4"
            disabled={cancelar.isPending}
          >
            <X aria-hidden className="size-4" />
            <span className="hidden in-data-[menu]:inline">Cancelar renovação</span>
          </Button>
        </Dica>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {confirmando ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar o cancelamento?</AlertDialogTitle>
              <AlertDialogDescription>
                Não haverá nova cobrança. A partir de {ate}, a turma fica só para consulta.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() =>
                  cancelar.mutate(undefined, {
                    onSuccess: () => toast.info('Renovação cancelada.'),
                    onError: avisarErro,
                  })
                }
              >
                Cancelar renovação
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Antes de cancelar</AlertDialogTitle>
              <AlertDialogDescription>
                Tudo continua funcionando até {ate}. Depois disso, a turma fica só para consulta: todos os
                membros continuam vendo tudo, mas ninguém registra nada novo. Nada é apagado, e para voltar a
                registrar basta contratar de novo. Sem nova contratação em 12 meses, a turma é encerrada e
                fica disponível para consulta por mais cinco anos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
              <Button variant="outline" onClick={() => definirConfirmando(true)}>
                Entendi, continuar
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
