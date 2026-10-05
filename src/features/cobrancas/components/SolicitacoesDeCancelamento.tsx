import { Check, MessageSquareWarning, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { AcaoComConfirmacao, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { Cartao } from '@/components/Cartao'
import { DialogoDeTexto } from '@/components/DialogoDeTexto'
import { Paginacao } from '@/components/Paginacao'
import { PAPEIS } from '@/config/perfis'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { useTamanhoDaPagina } from '@/hooks/useTelaGrande'
import { formatarCentavos, formatarData, formatarDataHora } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { paginar } from '@/lib/paginar'
import { useAprovarSolicitacao, useRecusarSolicitacao, useSolicitacoes } from '../hooks/useSolicitacoes'
import { rotuloDoItem, type SolicitacaoDeCancelamento } from '../types/cobrancas.types'

const esquemaDaRecusa = z.object({
  motivo: z
    .string()
    .trim()
    .min(1, 'Diga ao formando por que a comissão recusou.')
    .max(300, 'Escreva o motivo em até 300 caracteres.'),
})

/** "Festa — Festa 15", ou o nome do pacote avulso ou do item do pedido. */
const nomeDoItem = (solicitacao: SolicitacaoDeCancelamento) =>
  solicitacao.grupo ? `${solicitacao.grupo} — ${rotuloDoItem(solicitacao)}` : rotuloDoItem(solicitacao)

/**
 * A fila de solicitações de cancelamento do formando (Sprint 48, D8): pacote da cesta e pedido avulso.
 *
 * Aprovar cancela tudo e leva o já pago à lista "a devolver" da Conferência (D9); recusar pede o motivo, que o
 * formando lê. Enquanto espera — até o prazo de resposta (D37) —, as parcelas do item saem da cobrança. A Gestão
 * inteira vê a fila; quem responde é a tesouraria, que é quem mexe no dinheiro.
 *
 * Some quando não há solicitação — a tela de Pedidos não ganha um cartão vazio para uma coisa rara.
 */
export function SolicitacoesDeCancelamento() {
  const tamanhoDaPagina = useTamanhoDaPagina()
  const solicitacoes = useSolicitacoes('Aberto')
  const editavel = useEscritaLiberada()
  const { tem } = usePapel()
  const [paginaPedida, definirPagina] = useState(1)
  const pagina = paginar(solicitacoes.data ?? [], paginaPedida, tamanhoDaPagina)

  if (!solicitacoes.data?.length) return null

  return (
    <Cartao
      titulo="Pedidos de cancelamento"
      icone={MessageSquareWarning}
      descricao="Até a resposta, as parcelas do item não são cobradas. Sem resposta no prazo, a cobrança volta."
    >
      <ul className="grid gap-2">
        {pagina.visiveis.map((solicitacao) => (
          <li key={solicitacao.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm">
            <div className="grid min-w-0 flex-1">
              <span className="font-medium">
                {solicitacao.nome} · {nomeDoItem(solicitacao)}
              </span>
              <span className="text-muted-foreground text-xs">
                {solicitacao.pedido_id ? 'Pedido avulso' : 'Pacote da cesta'} · pedido em{' '}
                {formatarDataHora(solicitacao.pedido_em)} · responder até{' '}
                {formatarData(solicitacao.resposta_ate)}
                {solicitacao.pago_em_centavos > 0
                  ? ` · já pagou ${formatarCentavos(solicitacao.pago_em_centavos)}`
                  : ' · nada pago'}
              </span>
              {solicitacao.motivo ? <span className="text-xs">“{solicitacao.motivo}”</span> : null}
            </div>
            {editavel && tem(PAPEIS.tesoureiro) ? <Resposta solicitacao={solicitacao} /> : null}
          </li>
        ))}
      </ul>
      <Paginacao
        pagina={pagina.pagina}
        totalPaginas={pagina.totalPaginas}
        total={pagina.total}
        aoMudar={definirPagina}
      />
    </Cartao>
  )
}

function Resposta({ solicitacao }: { solicitacao: SolicitacaoDeCancelamento }) {
  const aprovar = useAprovarSolicitacao()
  const recusar = useRecusarSolicitacao()
  const item = nomeDoItem(solicitacao)

  return (
    <AcoesDaLinha rotulo={`Responder o pedido de ${solicitacao.nome}`}>
      <AcaoComConfirmacao
        rotulo="Aprovar"
        descricaoAcessivel={`Aprovar o cancelamento de ${item} de ${solicitacao.nome}`}
        icone={Check}
        tom="neutra"
        desabilitada={aprovar.isPending}
        confirmacao={{
          titulo: `Cancelar ${item} de ${solicitacao.nome}?`,
          descricao:
            solicitacao.pago_em_centavos > 0
              ? `As parcelas deixam de valer e os ${formatarCentavos(solicitacao.pago_em_centavos)} já pagos entram na lista "A devolver" da Conferência. O PIX de volta é da comissão.`
              : 'As parcelas deixam de valer. Nada foi pago, e não há o que devolver.',
          rotulo: 'Aprovar',
          aoConfirmar: () =>
            aprovar.mutate(solicitacao.id, {
              onSuccess: () => toast.info('Cancelamento aprovado.'),
              onError: avisarErro,
            }),
        }}
      />
      <DialogoDeTexto
        gatilho="Recusar"
        gatilhoIcone={{ icone: X, tom: 'perigo' }}
        titulo={`Recusar o pedido de ${solicitacao.nome}?`}
        descricao={`${item} continua contratado e a cobrança volta hoje. O formando lê o motivo na tela dele.`}
        campo="motivo"
        rotulo="Motivo"
        esquema={esquemaDaRecusa}
        confirmar="Recusar"
        confirmarOcupado="Recusando…"
        ocupado={recusar.isPending}
        aoEnviar={(motivo, concluir, falhar) =>
          recusar.mutate(
            { solicitacaoId: solicitacao.id, motivo },
            {
              onSuccess: () => {
                toast.info('Pedido recusado. A cobrança volta hoje.')
                concluir()
              },
              onError: falhar,
            },
          )
        }
      />
    </AcoesDaLinha>
  )
}
