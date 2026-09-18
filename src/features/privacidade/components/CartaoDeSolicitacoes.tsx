import { Download } from 'lucide-react'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { formatarData, formatarDataHora } from '@/lib/formato'
import {
  ROTULOS_DE_SOLICITACAO,
  ROTULOS_DE_STATUS,
  type SolicitacaoDePrivacidade,
  type StatusDaSolicitacao,
} from '../types/privacidade.types'

const TONS: Record<StatusDaSolicitacao, 'marca' | 'sucesso' | 'cinza' | 'perigo'> = {
  Pendente: 'marca',
  Concluida: 'sucesso',
  Cancelada: 'cinza',
  Falhou: 'perigo',
}

/**
 * O que a linha diz embaixo do título: o prazo, o que já aconteceu, ou o motivo da falha.
 *
 * Um pedido de eliminação pendente é o único que precisa dizer uma data no futuro — e precisa
 * mesmo: é o dia em que a conta da pessoa deixa de existir, e ela tem até lá para desistir.
 */
function detalhe(solicitacao: SolicitacaoDePrivacidade) {
  if (solicitacao.status === 'Falhou') return solicitacao.motivo ?? 'Não deu certo. Tente pedir de novo.'

  if (solicitacao.status === 'Pendente')
    return solicitacao.tipo === 'Exclusao'
      ? `Seus dados serão eliminados em ${formatarData(solicitacao.prazo_em)}. Até lá, você pode desistir.`
      : 'Estamos preparando seu pacote. Você recebe um e-mail quando ele ficar pronto.'

  if (solicitacao.status === 'Cancelada') return `Cancelado em ${formatarData(solicitacao.concluida_em)}.`

  if (solicitacao.tipo === 'Exclusao') return `Concluído em ${formatarData(solicitacao.concluida_em)}.`

  return solicitacao.disponivel
    ? `Pronto. O pacote fica disponível até ${formatarData(solicitacao.expira_em)}.`
    : `Gerado em ${formatarData(solicitacao.concluida_em)}. O prazo acabou e o pacote foi apagado — peça outro quando quiser.`
}

/**
 * Um pedido: o que é, em que pé está, quando foi pedido e a ação dele, à direita.
 *
 * Uma linha separada por traço, como todo par de `ListaDeDados` da página. O que estava errado antes
 * não era a falta de moldura: era o "pedido em" jogado na quina direita por um `ml-auto`, numa linha
 * invisível, e o botão caindo embaixo de tudo, longe da frase que o explicava.
 */
function Pedido({
  solicitacao,
  aoBaixar,
  aoConfirmar,
  aoCancelar,
  ocupado,
}: {
  solicitacao: SolicitacaoDePrivacidade
  aoBaixar: (solicitacao: SolicitacaoDePrivacidade) => void
  aoConfirmar: (id: string) => void
  aoCancelar: (id: string) => void
  ocupado: boolean
}) {
  const pronto = solicitacao.disponivel
  const pendente = solicitacao.status === 'Pendente'

  return (
    <li className="border-border flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b pb-4 last:border-0 last:pb-0">
      <div className="grid min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground font-medium">{ROTULOS_DE_SOLICITACAO[solicitacao.tipo]}</span>
          <Selo tom={TONS[solicitacao.status]}>{ROTULOS_DE_STATUS[solicitacao.status]}</Selo>
        </div>
        <p className="text-muted-foreground">{detalhe(solicitacao)}</p>
        <p className="text-texto-muted text-sm tabular-nums">
          Pedido em {formatarDataHora(solicitacao.criado_em)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {pronto ? (
          <Button size="sm" disabled={ocupado} onClick={() => aoBaixar(solicitacao)}>
            <Download aria-hidden />
            Baixar o pacote
          </Button>
        ) : null}
        {pendente && solicitacao.tipo === 'Exclusao' ? (
          // Confirmação mesmo tendo pedido a senha na abertura: aqui o efeito deixa de ser
          // "daqui a quinze dias" e passa a ser "agora", e é a última tela antes disso.
          <DialogoDeConfirmacao
            titulo="Eliminar seus dados agora?"
            descricao="Seu nome, documentos, contato e foto serão apagados em instantes, e seu acesso será encerrado. Não dá para desfazer."
            rotulo="Eliminar agora"
            rotuloDeCancelar="Voltar"
            destrutivo
            aoConfirmar={() => aoConfirmar(solicitacao.id)}
            gatilho={
              <Button size="sm" variant="outline" disabled={ocupado}>
                Eliminar agora
              </Button>
            }
          />
        ) : null}
        {pendente ? (
          <Button size="sm" variant="outline" disabled={ocupado} onClick={() => aoCancelar(solicitacao.id)}>
            Desistir do pedido
          </Button>
        ) : null}
      </div>
    </li>
  )
}

/**
 * A fila de pedidos do titular, embaixo dos direitos e separada deles por uma linha.
 *
 * Os pedidos concluídos ficam na lista, e é de propósito: ela é o registro de que a Kapa respondeu.
 * Pedido que some depois de atendido não prova nada a quem for questionado.
 *
 * @param aoBaixar Chamado com a solicitação pronta.
 * @param aoConfirmar Antecipa a eliminação.
 * @param aoCancelar Desiste do pedido.
 */
export function CartaoDeSolicitacoes({
  solicitacoes,
  aoBaixar,
  aoConfirmar,
  aoCancelar,
  ocupado,
}: {
  solicitacoes: SolicitacaoDePrivacidade[]
  aoBaixar: (solicitacao: SolicitacaoDePrivacidade) => void
  aoConfirmar: (id: string) => void
  aoCancelar: (id: string) => void
  ocupado: boolean
}) {
  return (
    <section className="border-border grid gap-3 border-t pt-5">
      <h3 className="text-muted-foreground text-sm font-medium">Seus pedidos</h3>

      {solicitacoes.length === 0 ? (
        <p className="text-muted-foreground text-[15px]">
          Você ainda não pediu nada. Use os botões acima para exportar seus dados ou solicitar a eliminação.
        </p>
      ) : (
        <ul className="grid gap-4 text-[15px]">
          {solicitacoes.map((solicitacao) => (
            <Pedido
              key={solicitacao.id}
              solicitacao={solicitacao}
              ocupado={ocupado}
              aoBaixar={aoBaixar}
              aoConfirmar={aoConfirmar}
              aoCancelar={aoCancelar}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
