import { type ReactNode, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
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
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { SeloDeStatus } from '../components/SeloDeStatus'
import { useAssinatura, useCancelarAssinatura } from '../hooks/useAssinatura'
import type { Assinatura } from '../types/assinaturas.types'

/**
 * Status, plano, vigência e próxima cobrança — e o cancelamento, para o Presidente.
 *
 * Gestão lê; só o Presidente contrata e cancela.
 */
export default function AssinaturaPage() {
  const assinatura = useAssinatura()
  const { ehPresidente } = usePapel()

  if (assinatura.isPending) return <p className="text-muted-foreground text-sm">Carregando…</p>

  if (assinatura.isError) {
    if (ehErroDaApi(assinatura.error) && assinatura.error.codigo === 'assinatura.nao_encontrada')
      return (
        <Cartao>
          <h2 className="text-foreground text-lg font-medium">Nenhum plano contratado</h2>
          <p className="text-muted-foreground text-sm">
            A turma ainda não contratou o Kapa. Até lá, os dados da turma podem ser editados, mas nada mais.
          </p>
          {ehPresidente ? <IrParaPlanos>Ver planos</IrParaPlanos> : null}
        </Cartao>
      )

    return (
      <p role="alert" className="text-destructive text-sm">
        {mensagemDoErro(assinatura.error)}
      </p>
    )
  }

  const dados = assinatura.data

  return (
    <Cartao>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-foreground text-lg font-medium">Plano {dados.plano.nome}</h2>
        <SeloDeStatus status={dados.status} />
      </div>

      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <Item rotulo="Valor">
          {formatarCentavos(dados.plano.precoEmCentavos)}{' '}
          {dados.plano.ciclo === 'Anual' ? 'por ano' : 'por mês'}
        </Item>
        <Item rotulo="Formandos">Até {formatarNumero(dados.plano.limiteDeFormandos)}</Item>
        <Item rotulo="Vigente até">{formatarData(dados.vigenteAte)}</Item>
        <Item rotulo="Próxima cobrança">
          {dados.proximaCobrancaEm ? formatarData(dados.proximaCobrancaEm) : 'Nenhuma'}
        </Item>
      </dl>

      <Situacao assinatura={dados} presidente={ehPresidente} />

      {ehPresidente && dados.status === 'Ativa' ? <CancelarRenovacao vigenteAte={dados.vigenteAte} /> : null}
    </Cartao>
  )
}

function Situacao({ assinatura, presidente }: { assinatura: Assinatura; presidente: boolean }) {
  switch (assinatura.status) {
    case 'Pendente':
      return (
        <Recado>
          O provedor ainda não confirmou o pagamento. Assim que confirmar, a turma é ativada e o Presidente
          recebe um e-mail.
          {presidente ? <IrParaPlanos>Retomar pagamento</IrParaPlanos> : null}
        </Recado>
      )
    case 'Cancelada':
      return (
        <Recado>
          Renovação cancelada em {formatarData(assinatura.canceladaEm)}. O acesso completo continua até{' '}
          {formatarData(assinatura.vigenteAte)}; depois a turma fica em modo leitura, sem perder nada.
        </Recado>
      )
    case 'Vencida':
      return (
        <Recado>
          A assinatura venceu e a turma está em modo leitura. Nada foi apagado: todos continuam consultando.
          {presidente ? <IrParaPlanos>Contratar novamente</IrParaPlanos> : null}
        </Recado>
      )
    case 'Ativa':
      return null
  }
}

/**
 * Cancelamento em duas etapas.
 *
 * A primeira diz, em texto claro, até quando o acesso continua e o que acontece depois (modo
 * leitura, nada apagado); só a segunda cancela. Cancelar sem essa informação é o caminho mais curto
 * para um pedido de estorno.
 */
function CancelarRenovacao({ vigenteAte }: { vigenteAte?: string }) {
  const cancelar = useCancelarAssinatura()
  const [confirmando, definirConfirmando] = useState(false)
  const ate = formatarData(vigenteAte)

  return (
    <div className="border-border grid gap-2 border-t pt-5">
      <h3 className="text-foreground text-sm font-medium">Cancelar renovação</h3>
      <p className="text-muted-foreground text-sm">
        A cobrança automática para; a vigência já paga é respeitada.
      </p>

      <AlertDialog onOpenChange={(aberto) => (aberto ? null : definirConfirmando(false))}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="justify-self-start" disabled={cancelar.isPending}>
            Cancelar renovação
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          {confirmando ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar o cancelamento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Não haverá nova cobrança. Em {ate} a turma passa para modo leitura.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() =>
                    cancelar.mutate(undefined, {
                      onSuccess: () => toast.success('Renovação cancelada.'),
                      onError: (erro) => toast.error(mensagemDoErro(erro)),
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
                  O acesso completo da turma continua até {ate}. Depois disso, a formatura entra em modo
                  leitura: todos os membros continuam consultando tudo, e nada é apagado. Para voltar a
                  registrar, basta contratar de novo.
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
    </div>
  )
}

function Cartao({ children }: { children: ReactNode }) {
  return <section className="bg-card shadow-cartao grid max-w-2xl gap-5 rounded-2xl p-5">{children}</section>
}

function Item({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-muted-foreground">{rotulo}</dt>
      <dd className="text-foreground font-medium">{children}</dd>
    </div>
  )
}

function Recado({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted text-muted-foreground grid gap-3 rounded-xl px-4 py-3 text-sm">{children}</div>
  )
}

function IrParaPlanos({ children }: { children: ReactNode }) {
  return (
    <Button asChild className="justify-self-start">
      <Link to={ROTAS.planos}>{children}</Link>
    </Button>
  )
}
