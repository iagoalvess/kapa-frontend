import { Link } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos } from '@/lib/formato'
import { emAberto } from '@/types/cobranca'
import { useEstornarBaixa } from '../hooks/useBaixa'
import { esquemaDoEstorno } from '../schemas/pagamento.schema'
import type { Parcela } from '../types/pagamentos.types'
import { BotaoDeRecibo } from './BotaoDeRecibo'
import { DialogoDeBaixaManual } from './DialogoDeBaixaManual'
import { DialogoDeTexto } from './DialogoDeTexto'

/**
 * O que dá para fazer com uma parcela na tela Parcelas, conforme a situação e o papel:
 *
 * - em aberto, sem aviso: a Tesouraria baixa à mão;
 * - com aviso do formando: vai para a Conferência — baixar por fora deixaria o aviso na fila;
 * - paga: o Presidente estorna, com justificativa.
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
          rotulo={`Recibo de ${parcela.nome}, parcela ${parcela.numero}/${parcela.de}`}
        />
      ) : null}
      <Acao parcela={parcela} />
    </>
  )
}

/** A ação de escrita que a situação e o papel permitem — uma, ou nenhuma. */
function Acao({ parcela }: { parcela: Parcela }) {
  const { tem, ehPresidente } = usePapel()
  const liberado = useEscritaLiberada()
  const estornar = useEstornarBaixa()

  if (emAberto(parcela) && tem(PAPEIS.tesoureiro)) {
    return parcela.em_conferencia ? (
      <Button asChild variant="outline" size="sm">
        <Link to={ROTAS.conferencia}>Conferir</Link>
      </Button>
    ) : (
      <DialogoDeBaixaManual parcela={parcela} desabilitado={!liberado} />
    )
  }

  if (parcela.status === 'Paga' && ehPresidente) {
    return (
      <DialogoDeTexto
        gatilho="Estornar"
        titulo="Estornar a baixa"
        descricao={
          <>
            A parcela de {parcela.nome} volta a ficar em aberto, e o recebimento de{' '}
            {formatarCentavos(parcela.valor_pago_em_centavos)} fica marcado como estornado. A baixa e o
            estorno ficam registrados, em nome de quem fez cada um.
          </>
        }
        campo="justificativa"
        rotulo="Justificativa"
        esquema={esquemaDoEstorno}
        confirmar="Estornar baixa"
        confirmarOcupado="Estornando…"
        ocupado={estornar.isPending}
        desabilitado={!liberado}
        aoEnviar={(justificativa, concluir, falhar) =>
          estornar.mutate(
            { parcelaId: parcela.id, justificativa },
            {
              onSuccess: () => {
                toast.info('Baixa estornada. A parcela voltou a ficar em aberto.')
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
