import { CalendarSync, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { useVigorarPlano } from '../hooks/usePlano'
import type { PlanoDeCobranca, SimulacaoDoPlano } from '../types/cobrancas.types'

interface Props {
  plano: PlanoDeCobranca
  /** Simulação do plano **gravado**: os números da confirmação de vigência. */
  simulacao?: SimulacaoDoPlano
  /** Falso esconde as ações — formatura fora de `Ativa`. */
  editavel: boolean
  /** Abre o diálogo do item novo. */
  aoIncluirItem: () => void
  /** Os itens do plano: é este cartão que os hospeda. */
  children: ReactNode
}

/**
 * O plano e os itens dele, no cartão principal da tela: nome, situação, uma linha dizendo o momento
 * e, à direita, a ação que compromete a turma.
 *
 * As regras de atraso saíram daqui para o cartão lateral: são quatro números que quase nunca mudam,
 * e ocupando a largura da tela pesavam mais que os itens, que são o trabalho do dia.
 *
 * "Incluir item" mora no cabeçalho, como a ação de todo cartão do app: o formulário ficava aberto
 * no pé do cartão o tempo todo, ocupando metade da tela para a coisa mais rara que se faz nela.
 */
export function CartaoDoPlano({ plano, simulacao, editavel, aoIncluirItem, children }: Props) {
  const { ehPresidente } = usePapel()
  const vigente = plano.status === 'Vigente'

  const descricao = vigente
    ? `Em vigor desde ${formatarData(plano.vigente_desde)}. Mudar o valor de um item vale só para as parcelas que ainda não venceram.`
    : ehPresidente
      ? 'Em montagem. Confira a grade ao lado e coloque o plano em vigor.'
      : 'Em montagem. Conferida a grade, quem coloca o plano em vigor é o Presidente.'

  return (
    <Cartao
      titulo={plano.nome}
      icone={CalendarSync}
      selo={vigente ? <Selo tom="sucesso">Vigente</Selo> : <Selo tom="cinza">Em montagem</Selo>}
      descricao={descricao}
      acao={
        editavel ? (
          <>
            <Button variant="outline" size="sm" onClick={aoIncluirItem}>
              <Plus aria-hidden />
              Incluir item
            </Button>
            {!vigente && ehPresidente ? <ColocarEmVigor plano={plano} simulacao={simulacao} /> : null}
          </>
        ) : null
      }
    >
      {children}
    </Cartao>
  )
}

/**
 * O botão que compromete a turma, com a confirmação que diz quanto.
 *
 * Os números são os do plano **gravado** — o formulário de item em edição ainda não é o plano.
 */
function ColocarEmVigor({ plano, simulacao }: { plano: PlanoDeCobranca; simulacao?: SimulacaoDoPlano }) {
  const vigorar = useVigorarPlano()
  const semItens = !simulacao || simulacao.parcelas.length === 0

  return (
    <DialogoDeConfirmacao
      gatilho={
        <Button
          size="sm"
          disabled={semItens || vigorar.isPending}
          title={semItens ? 'Inclua ao menos um item para colocar em vigor.' : undefined}
        >
          Colocar em vigor
        </Button>
      }
      titulo={`Colocar “${plano.nome}” em vigor?`}
      descricao={
        simulacao
          ? `Cada formando que aderir passa a dever ${formatarCentavos(simulacao.total_por_formando)}, em ${formatarNumero(simulacao.parcelas.length)} parcelas. Hoje são ${formatarNumero(simulacao.formandos)} na turma: ${formatarCentavos(simulacao.total_da_turma)} no total.`
          : null
      }
      rotuloDeCancelar="Revisar"
      rotulo="Colocar em vigor"
      aoConfirmar={() =>
        vigorar.mutate(plano.id, {
          onSuccess: () => toast.success('Plano em vigor.'),
          onError: (erro) => toast.error(mensagemDoErro(erro)),
        })
      }
    >
      <p className="text-muted-foreground text-sm">
        Depois de em vigor, o valor de um item ainda pode mudar — só para as parcelas que não venceram.
      </p>
    </DialogoDeConfirmacao>
  )
}
