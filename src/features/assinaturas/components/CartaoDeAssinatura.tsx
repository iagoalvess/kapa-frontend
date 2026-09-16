import { ArrowUpRight } from 'lucide-react'
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
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import { ehErroDaApi, mensagemDoErro } from '@/lib/http/erros'
import { useAssinatura, useCancelarAssinatura } from '../hooks/useAssinatura'
import type { Assinatura } from '../types/assinaturas.types'
import { SeloDeStatus } from './SeloDeStatus'

/**
 * Status, plano, vigência e próxima cobrança — e o cancelamento, para o Presidente. Mora na
 * página da formatura, ao lado dos dados cadastrais.
 *
 * Gestão lê; só o Presidente contrata e cancela. Quem não é da Gestão não deve montar este
 * cartão: a API responderia 403.
 */
export function CartaoDeAssinatura() {
  const assinatura = useAssinatura()
  const { ehPresidente } = usePapel()

  if (assinatura.isPending)
    return (
      <Cartao rotulo="Assinatura">
        <EsqueletoDeDados linhas={3} />
      </Cartao>
    )

  if (assinatura.isError) {
    if (ehErroDaApi(assinatura.error) && assinatura.error.codigo === 'assinatura.nao_encontrada')
      return (
        <Cartao rotulo="Assinatura">
          <h2 className="text-foreground text-lg font-medium">Nenhum plano contratado</h2>
          <p className="text-muted-foreground text-sm">
            A turma ainda não contratou o Kapa. Até lá, os dados da turma podem ser editados, mas nada mais.
          </p>
          {ehPresidente ? <IrParaPlanos>Ver planos</IrParaPlanos> : null}
        </Cartao>
      )

    return (
      <Cartao rotulo="Assinatura">
        <ErroDaConsulta erro={assinatura.error} />
      </Cartao>
    )
  }

  const dados = assinatura.data

  return (
    <Cartao rotulo="Assinatura">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-foreground text-lg font-medium">Plano {dados.plano.nome}</h2>
        <div className="flex items-center gap-1">
          <SeloDeStatus status={dados.status} />
          <AtalhoParaPlanos />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <Item rotulo="Valor">
          {formatarCentavos(dados.plano.preco_em_centavos)}{' '}
          {dados.plano.ciclo === 'Anual' ? 'por ano' : 'por mês'}
        </Item>
        <Item rotulo="Formandos">Até {formatarNumero(dados.plano.limite_de_formandos)}</Item>
        <Item rotulo="Vigente até">{formatarData(dados.vigente_ate)}</Item>
        <Item rotulo="Próxima cobrança">
          {dados.proxima_cobranca_em ? formatarData(dados.proxima_cobranca_em) : 'Nenhuma'}
        </Item>
      </dl>

      <Situacao assinatura={dados} presidente={ehPresidente} />

      {ehPresidente && dados.status === 'Ativa' ? <CancelarRenovacao vigenteAte={dados.vigente_ate} /> : null}
    </Cartao>
  )
}

function Situacao({ assinatura, presidente }: { assinatura: Assinatura; presidente: boolean }) {
  switch (assinatura.status) {
    case 'Pendente':
      return (
        <Recado>
          Ainda estamos aguardando a confirmação do pagamento. Assim que ela chegar, a turma é liberada e o
          Presidente recebe um e-mail.
          {presidente ? <IrParaPlanos>Retomar pagamento</IrParaPlanos> : null}
        </Recado>
      )
    case 'Cancelada':
      return (
        <Recado>
          Renovação cancelada em {formatarData(assinatura.cancelada_em)}. Tudo continua funcionando até{' '}
          {formatarData(assinatura.vigente_ate)}. Depois disso, a turma fica só para consulta — nada é
          apagado.
        </Recado>
      )
    case 'Vencida':
      return (
        <Recado>
          O plano venceu e a turma está só para consulta. Nada foi apagado: todos continuam vendo tudo, mas
          nada novo pode ser registrado até contratar de novo.
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
        Não haverá nova cobrança, e a turma continua funcionando até o fim do período já pago.
      </p>

      <AlertDialog onOpenChange={(aberto) => (aberto ? null : definirConfirmando(false))}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-1/2" disabled={cancelar.isPending}>
            Cancelar renovação
          </Button>
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
                  Tudo continua funcionando até {ate}. Depois disso, a turma fica só para consulta: todos os
                  membros continuam vendo tudo, mas ninguém registra nada novo. Nada é apagado, e para voltar
                  a registrar basta contratar de novo.
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

/**
 * A seta que leva do cartão à vitrine. Com a assinatura ativa nada na tela levava aos planos — o
 * único caminho era digitar a URL.
 */
function AtalhoParaPlanos() {
  return (
    <Button asChild variant="ghost" size="icon" className="text-muted-foreground -my-1 size-8">
      <Link to={ROTAS.planos} title="Ver planos" aria-label="Ver planos">
        <ArrowUpRight aria-hidden />
      </Link>
    </Button>
  )
}

function IrParaPlanos({ children }: { children: ReactNode }) {
  return (
    <Button asChild className="w-1/2">
      <Link to={ROTAS.planos}>{children}</Link>
    </Button>
  )
}
