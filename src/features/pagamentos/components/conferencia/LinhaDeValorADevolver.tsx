import { CheckCheck, HandCoins } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeComprovante } from '@/components/CampoDeComprovante'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Selo, type TomDoSelo } from '@/components/Selo'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { formatarCentavos, formatarData, formatarDataHora } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { rotuloDoItem } from '@/types/cobranca'
import { useFecharValorADevolver, useRegistrarDevolucao } from '../../hooks/useValoresADevolver'
import { esquemaDoFechamento } from '../../schemas/pagamento.schema'
import type {
  OrigemDoValorADevolver,
  StatusDoValorADevolver,
  ValorADevolver,
} from '../../types/pagamentos.types'
import { DialogoDeTexto } from '@/components/DialogoDeTexto'
import { CelulaDoFormando } from './Formando'

/** Como a lista diz de onde veio o dinheiro. */
export const ROTULOS_DE_ORIGEM: Record<OrigemDoValorADevolver, string> = {
  CreditoDePedido: 'Crédito de pedido cancelado',
  ParcelaCancelada: 'Parcela cancelada com pagamento',
  PagoSemParcela: 'Pago no Mercado Pago sem parcela',
}

const SITUACOES: Record<StatusDoValorADevolver, { rotulo: string; tom: TomDoSelo }> = {
  ADevolver: { rotulo: 'A devolver', tom: 'alerta' },
  Devolvido: { rotulo: 'Devolvido', tom: 'sucesso' },
  Fechado: { rotulo: 'Resolvido', tom: 'neutro' },
}

/** "Convite extra 2/…" não cabe: aqui só se sabe o número da parcela, não o total do item. */
const detalhe = (valor: ValorADevolver) => {
  const item = rotuloDoItem(valor)
  if (valor.numero_da_parcela === null) return item
  const vence = valor.vencimento ? ` · vence ${formatarData(valor.vencimento)}` : ''
  return `${item} · parcela ${valor.numero_da_parcela}${vence}`
}

/**
 * Um valor que entrou e não paga mais nada, até a comissão resolver (Sprint 42).
 *
 * O Kapa não devolve dinheiro: crédito e parcial voltam por PIX da comissão, e a devolução se
 * registra com o comprovante — a saída entra no caixa. O pago sem parcela está na conta do Mercado
 * Pago, fora do caixa: a comissão devolve pelo painel dele (ou lança como outra receita) e fecha o
 * aviso dizendo o que fez.
 */
export function LinhaDeValorADevolver({ valor }: { valor: ValorADevolver }) {
  const situacao = SITUACOES[valor.status]

  return (
    <tr className="border-b last:border-0">
      <CelulaDoFormando nome={valor.nome} usuarioId={valor.usuario_id} detalhe={detalhe(valor)} />
      <td className="py-3 pr-4">
        {ROTULOS_DE_ORIGEM[valor.origem]}
        {valor.observacao ? <span className="text-texto-muted block text-xs">{valor.observacao}</span> : null}
      </td>
      <td className="py-3 pr-4 text-right whitespace-nowrap">{formatarCentavos(valor.valor_em_centavos)}</td>
      <td className="text-texto-muted py-3 pr-4 whitespace-nowrap">
        {formatarDataHora(valor.resolvido_em ?? valor.criado_em)}
      </td>
      <td className="py-3 pr-4">
        <Selo tom={situacao.tom}>{situacao.rotulo}</Selo>
      </td>
      <td className="py-3 text-right">
        {valor.status === 'ADevolver' ? (
          <AcoesDaLinha rotulo={`Ações do valor a devolver de ${valor.nome}`}>
            {valor.origem === 'PagoSemParcela' ? (
              <FecharAviso valor={valor} />
            ) : (
              <RegistrarDevolucao valor={valor} />
            )}
          </AcoesDaLinha>
        ) : null}
      </td>
    </tr>
  )
}

/** A comissão fez o PIX de volta: com o comprovante, o valor sai da lista e a saída entra no caixa. */
function RegistrarDevolucao({ valor }: { valor: ValorADevolver }) {
  const [aberto, definirAberto] = useState(false)
  const [comprovante, definirComprovante] = useState<File | undefined>(undefined)
  const liberado = useEscritaLiberada()
  const devolver = useRegistrarDevolucao()

  const abrir = () => {
    definirComprovante(undefined)
    definirAberto(true)
  }

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault()
    if (!comprovante) return

    devolver.mutate(
      { id: valor.id, comprovante },
      {
        onSuccess: () => {
          toast.success('Devolução registrada. A saída entrou no caixa.')
          definirAberto(false)
        },
        onError: avisarErro,
      },
    )
  }

  return (
    <>
      <AcaoDaLinha
        rotulo="Registrar devolução"
        descricaoAcessivel={`Registrar a devolução a ${valor.nome}`}
        icone={HandCoins}
        onClick={abrir}
        desabilitada={!liberado}
      />

      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo="Registrar a devolução"
        descricao={
          <>
            {formatarCentavos(valor.valor_em_centavos)} para {valor.nome}. O Kapa não devolve dinheiro: anexe
            o comprovante do PIX que a comissão fez, e a saída entra no caixa de hoje.
          </>
        }
      >
        <form onSubmit={enviar} noValidate className="grid gap-4">
          <CampoDeComprovante
            valor={comprovante}
            aoEscolher={definirComprovante}
            desabilitado={devolver.isPending}
            obrigatorio
          />
          <AcoesDoFormulario
            aoCancelar={() => definirAberto(false)}
            ocupado={devolver.isPending}
            desabilitado={comprovante === undefined}
            rotulo="Registrar"
            rotuloOcupado="Registrando…"
          />
        </form>
      </DialogoDeFormulario>
    </>
  )
}

/** O pago sem parcela: a comissão resolveu no Mercado Pago (ou lançou como outra receita) e diz o que fez. */
function FecharAviso({ valor }: { valor: ValorADevolver }) {
  const liberado = useEscritaLiberada()
  const fechar = useFecharValorADevolver()

  return (
    <DialogoDeTexto
      gatilho="Fechar aviso"
      gatilhoIcone={{ icone: CheckCheck }}
      titulo="Fechar o aviso do pagamento sem parcela"
      descricao={
        <>
          Entraram {formatarCentavos(valor.valor_em_centavos)} de {valor.nome} pelo Mercado Pago sem parcela
          aberta para baixar. O dinheiro está na conta do Mercado Pago: devolva pelo painel dele ou lance como
          outra receita, e conte aqui o que foi feito.
        </>
      }
      campo="observacao"
      rotulo="O que foi feito"
      esquema={esquemaDoFechamento}
      confirmar="Fechar aviso"
      confirmarOcupado="Fechando…"
      ocupado={fechar.isPending}
      desabilitado={!liberado}
      aoEnviar={(observacao, concluir, falhar) =>
        fechar.mutate(
          { id: valor.id, observacao },
          {
            onSuccess: () => {
              toast.info('Aviso fechado.')
              concluir()
            },
            onError: falhar,
          },
        )
      }
    />
  )
}
