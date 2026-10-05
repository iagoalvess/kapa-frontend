import { Ban, FileCheck, Undo2 } from 'lucide-react'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { toast } from 'sonner'
import { AcaoDaLinha } from '@/components/AcoesDaLinha'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos } from '@/lib/formato'
import { emAberto } from '@/types/cobranca'
import { useCancelarParcela, useEstornarBaixa } from '../hooks/useBaixa'
import { esquemaDoCancelamento, esquemaDoEstorno } from '../schemas/pagamento.schema'
import type { Parcela } from '../types/pagamentos.types'
import { BotaoDeRecibo } from './BotaoDeRecibo'
import { DialogoDeBaixaManual } from './DialogoDeBaixaManual'
import { DialogoDeTexto } from '@/components/DialogoDeTexto'

/**
 * O que dá para fazer com uma parcela na tela Parcelas, conforme a situação e o papel:
 *
 * - em aberto, sem aviso: a Tesouraria baixa à mão, ou cancela a parcela com justificativa (Sprint 42);
 * - com aviso do formando: vai para a Conferência — baixar por fora deixaria o aviso na fila;
 * - paga: o Presidente estorna, com justificativa. A baixa que veio do Mercado Pago também — o Kapa só
 *   desfaz o registro, e o diálogo diz que devolver pelo painel dele é da comissão.
 *
 * - com baixa: o recibo, para toda a gestão (Sprint 22) — com o CPF mascarado, quem decide é a API.
 *
 * Exibição só: quem recusa é a API. A Comissão, que só consulta, vê só o recibo.
 */
export function AcoesDaParcela({ parcela }: { parcela: Parcela }) {
  return (
    <>
      {parcela.recebimento_id ? (
        <BotaoDeRecibo
          recebimentoId={parcela.recebimento_id}
          descricaoAcessivel={`Recibo de ${parcela.nome}, parcela ${parcela.numero}/${parcela.de}`}
        />
      ) : null}
      <Acao parcela={parcela} />
    </>
  )
}

/** As ações de escrita que a situação e o papel permitem — nenhuma, uma ou, na aberta, duas. */
function Acao({ parcela }: { parcela: Parcela }) {
  const { tem, ehPresidente } = usePapel()
  const liberado = useEscritaLiberada()
  const estornar = useEstornarBaixa()

  if (emAberto(parcela) && tem(PAPEIS.tesoureiro)) {
    return parcela.em_conferencia ? (
      <AcaoDaLinha asChild rotulo="Conferir">
        <LinkDaPagina to={ROTAS.conferencia} aria-label="Conferir">
          <FileCheck aria-hidden className="size-4" />
        </LinkDaPagina>
      </AcaoDaLinha>
    ) : (
      <>
        <DialogoDeBaixaManual parcela={parcela} desabilitado={!liberado} />
        <CancelarParcela parcela={parcela} desabilitado={!liberado} />
      </>
    )
  }

  if (parcela.status === 'Paga' && ehPresidente) {
    return (
      <DialogoDeTexto
        gatilho="Estornar"
        gatilhoIcone={{ icone: Undo2, tom: 'perigo' }}
        titulo="Desfazer o pagamento registrado"
        descricao={
          <>
            A parcela de {parcela.nome} volta a ficar em aberto, e o recebimento de{' '}
            {formatarCentavos(parcela.valor_pago_em_centavos)} ficará marcado como estornado. O registro do
            pagamento e o estorno continuarão no histórico, com o nome de quem fez cada ação.
            {parcela.pelo_mercado_pago ? (
              <span className="text-warning-text mt-2 block">
                Este pagamento veio pelo Mercado Pago. O Kapa não devolve dinheiro: estornar só desfaz o
                registro. Se ainda não devolveu, devolva pelo painel do Mercado Pago.
              </span>
            ) : null}
          </>
        }
        campo="justificativa"
        rotulo="Justificativa"
        esquema={esquemaDoEstorno}
        confirmar="Estornar pagamento"
        confirmarOcupado="Estornando…"
        ocupado={estornar.isPending}
        desabilitado={!liberado}
        aoEnviar={(justificativa, concluir, falhar) =>
          estornar.mutate(
            { parcelaId: parcela.id, justificativa },
            {
              onSuccess: () => {
                toast.info('Pagamento estornado. A parcela voltou a ficar em aberto.')
                concluir()
              },
              onError: falhar,
            },
          )
        }
      />
    )
  }

  return null
}

/**
 * O cancelamento avulso (Sprint 42, decisão 8): a parcela deixa de ser devida, com justificativa na
 * auditoria. O que já tinha entrado nela vai para a lista "a devolver" da Conferência — o PIX de
 * volta é da comissão. Renegociar é cancelar e lançar outra avulsa.
 */
function CancelarParcela({ parcela, desabilitado }: { parcela: Parcela; desabilitado: boolean }) {
  const cancelar = useCancelarParcela()
  const pago = parcela.valor_pago_em_centavos ?? 0

  return (
    <DialogoDeTexto
      gatilho="Cancelar parcela"
      gatilhoIcone={{ icone: Ban, tom: 'perigo' }}
      titulo="Cancelar esta parcela?"
      descricao={
        <>
          A parcela {parcela.numero}/{parcela.de} de {parcela.nome} deixa de ser devida.
          {pago > 0
            ? ` Já entraram ${formatarCentavos(pago)} por ela: o valor vai para a lista "A devolver" da Conferência, e o PIX de volta é da comissão.`
            : null}
        </>
      }
      campo="justificativa"
      rotulo="Justificativa"
      esquema={esquemaDoCancelamento}
      confirmar="Cancelar parcela"
      confirmarOcupado="Cancelando…"
      ocupado={cancelar.isPending}
      desabilitado={desabilitado}
      aoEnviar={(justificativa, concluir, falhar) =>
        cancelar.mutate(
          { parcelaId: parcela.id, justificativa },
          {
            onSuccess: () => {
              toast.info(
                pago > 0
                  ? 'Parcela cancelada. O que já tinha entrado foi para "A devolver".'
                  : 'Parcela cancelada.',
              )
              concluir()
            },
            onError: falhar,
          },
        )
      }
    />
  )
}
