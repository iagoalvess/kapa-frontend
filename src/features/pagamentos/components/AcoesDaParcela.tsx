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
import { DialogoDeBaixaManual } from './DialogoDeBaixaManual'
import { DialogoDeTexto } from './DialogoDeTexto'

/**
 * O que dá para fazer com uma parcela na tela Parcelas, conforme a situação e o papel:
 *
 * - em aberto, sem aviso: a Tesouraria baixa à mão;
 * - com aviso do formando: vai para a Conferência — baixar por fora deixaria o aviso na fila;
 * - paga: o Presidente estorna, com justificativa.
 *
 * Exibição só: quem recusa é a API. A Comissão, que só consulta, não vê botão nenhum.
 */
export function AcoesDaParcela({ parcela }: { parcela: Parcela }) {
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
        confirmar={estornar.isPending ? 'Estornando…' : 'Estornar baixa'}
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
