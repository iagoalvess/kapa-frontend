import { CalendarSync, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePapel } from '@/hooks/useSessao'
import { formatarData, formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
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
 * "Novo pacote" mora no cabeçalho, como a ação de todo cartão do app: o formulário ficava aberto
 * no pé do cartão o tempo todo, ocupando metade da tela para a coisa mais rara que se faz nela.
 */
export function CartaoDoPlano({ plano, simulacao, editavel, aoIncluirItem, children }: Props) {
  const { ehPresidente } = usePapel()
  const vigente = plano.status === 'Vigente'

  const descricao = vigente
    ? `Em vigor desde ${formatarData(plano.vigente_desde)}. Cada formando escolhe os pacotes dele na adesão; mudar o preço vale só para as parcelas que ainda não venceram.`
    : ehPresidente
      ? 'Confira as parcelas ao lado. Quando estiver tudo certo, coloque o plano em vigor.'
      : 'O plano está sendo preparado. Depois de conferir as parcelas, o presidente poderá colocá-lo em vigor.'

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
              Novo pacote
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

  const botaoDeVigorar = (
    <Button size="sm" disabled={semItens || vigorar.isPending}>
      Colocar em vigor
    </Button>
  )

  return (
    <Tooltip>
      <DialogoDeConfirmacao
        gatilho={
          semItens ? (
            <TooltipTrigger asChild>
              {/* Botão desabilitado não recebe hover: o vão mostra o tooltip por ele. */}
              <span className="inline-flex">{botaoDeVigorar}</span>
            </TooltipTrigger>
          ) : (
            botaoDeVigorar
          )
        }
        titulo={`Colocar “${plano.nome}” em vigor?`}
        descricao={
          simulacao
            ? `O catálogo abre para a adesão: cada formando escolhe os pacotes dele e passa a dever só o que escolheu. Hoje são ${formatarNumero(simulacao.formandos)} na turma.`
            : null
        }
        rotuloDeCancelar="Revisar"
        rotulo="Colocar em vigor"
        aoConfirmar={() =>
          vigorar.mutate(plano.id, {
            onSuccess: () => toast.success('Plano em vigor.'),
            onError: avisarErro,
          })
        }
      >
        <p className="text-muted-foreground text-sm">
          Depois de em vigor, o preço de um pacote ainda pode mudar — só para as parcelas que não venceram.
        </p>
      </DialogoDeConfirmacao>
      {semItens ? <TooltipContent>Inclua ao menos uma cobrança para colocar em vigor.</TooltipContent> : null}
    </Tooltip>
  )
}
