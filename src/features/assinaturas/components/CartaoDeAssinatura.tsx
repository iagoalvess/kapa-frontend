import { ArrowUpRight } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { LinkDaPagina } from '@/components/LinkDaPagina'
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
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { Dica } from '@/components/Dica'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import { avisarErro, ehErroDaApi } from '@/lib/http/erros'
import { MEIOS_DE_PAGAMENTO } from '@/types/pagamento'
import {
  useAssinatura,
  useCancelarAssinatura,
  useDesistirDaAssinatura,
  useTrocarMeio,
  useTrocarPlano,
} from '../hooks/useAssinatura'
import { usePagarCiclo } from '../hooks/useCheckout'
import type { Assinatura } from '../types/assinaturas.types'
import { SeloDeStatus } from './SeloDeStatus'

/**
 * Status, plano, vigência e próxima cobrança — e o cancelamento, para o Presidente. Mora na
 * página da formatura, ao lado dos dados cadastrais.
 *
 * Gestão lê; só o Presidente contrata e cancela. Quem não é da Gestão não deve montar este
 * cartão: a API responderia 403.
 *
 * A turma que nunca contratou (`ja_contratou` falso) está no gratuito, e o cartão diz isso sem
 * consultar: perguntar pela assinatura dela só devolvia 404 `assinatura.nao_encontrada`. O checkout
 * deixado pela metade é retomado em Planos, que lê a assinatura pendente.
 *
 * @param jaContratou O `ja_contratou` da formatura da sessão.
 */
export function CartaoDeAssinatura({ jaContratou }: { jaContratou: boolean }) {
  return jaContratou ? <AssinaturaContratada /> : <PlanoGratuito />
}

/** O gratuito: o que ele dá, e a porta para Planos. */
function PlanoGratuito() {
  const { ehPresidente } = usePapel()

  return (
    <Cartao rotulo="Assinatura">
      <h2 className="text-foreground text-xl leading-snug font-medium">Plano gratuito</h2>
      {/* O que o grátis dá de verdade (Sprint 45): a frase antiga dizia que nada além do cadastro
          funcionava, e a turma gratuita cobra, recebe e fecha o caixa. */}
      <TextoDoCartao>
        A comissão já usa cobranças, PIX, despesas e caixa. Para convidar formandos e liberar a festa,
        contrate um plano.
      </TextoDoCartao>
      {ehPresidente ? <IrParaPlanos>Ver planos</IrParaPlanos> : null}
    </Cartao>
  )
}

/** A assinatura da turma que já contratou: status, plano, vigência e as ações do Presidente. */
function AssinaturaContratada() {
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
      return <PlanoGratuito />

    return (
      <Cartao rotulo="Assinatura">
        <ErroDaConsulta compacto erro={assinatura.error} aoTentarDeNovo={() => void assinatura.refetch()} />
      </Cartao>
    )
  }

  const dados = assinatura.data

  return (
    <Cartao rotulo="Assinatura">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-foreground text-xl leading-snug font-medium">Plano {dados.plano.nome}</h2>
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
        <Item rotulo={dados.meio === 'Pix' ? 'Próximo PIX' : 'Próxima cobrança'}>
          {dados.proxima_cobranca_em ? formatarData(dados.proxima_cobranca_em) : 'Nenhuma'}
        </Item>
        <Item rotulo="Pagamento">
          {MEIOS_DE_PAGAMENTO[dados.meio].rotulo}
          {dados.meio === 'Cartao' ? ', automático' : ', a cada ciclo'}
        </Item>
        {dados.cupom ? (
          <Item rotulo="Cupom">
            {dados.cupom.codigo}: {dados.cupom.percentual}% na primeira cobrança
          </Item>
        ) : null}
      </dl>

      <Situacao assinatura={dados} presidente={ehPresidente} />

      {dados.status === 'Ativa' ? <Andamento assinatura={dados} presidente={ehPresidente} /> : null}

      {ehPresidente && dados.desistencia_ate ? <Desistir ate={dados.desistencia_ate} /> : null}

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
 * O que está em curso na assinatura ativa (Sprint 37): a descida de plano agendada, o cartão que espera
 * autorização, o PIX da renovação e a troca de meio.
 *
 * A troca de meio confirma antes porque as duas mexem em dinheiro de outro jeito: ir para o PIX cancela o
 * débito automático na hora; ir para o cartão leva à página do Mercado Pago, e a primeira cobrança é no
 * vencimento — sem cobrar em dobro (P5).
 */
function Andamento({ assinatura, presidente }: { assinatura: Assinatura; presidente: boolean }) {
  const trocarMeio = useTrocarMeio()
  const trocarPlano = useTrocarPlano()
  const pagarCiclo = usePagarCiclo()
  const vencimento = formatarData(assinatura.vigente_ate)
  const paraOPix = assinatura.meio === 'Cartao'

  return (
    <>
      {assinatura.proximo_plano ? (
        <Recado>
          <span>
            A partir da renovação de {vencimento}, o plano passa a ser o {assinatura.proximo_plano.nome}.
          </span>
          {/* A descida agendada tem volta: escolher o plano atual desfaz o agendamento no back. */}
          {presidente ? (
            <Button
              variant="outline"
              className="w-1/2"
              disabled={trocarPlano.isPending}
              onClick={() =>
                trocarPlano.mutate(assinatura.plano.codigo, {
                  onSuccess: () =>
                    toast.success(`Mudança desfeita. A turma continua no ${assinatura.plano.nome}.`),
                  onError: avisarErro,
                })
              }
            >
              Manter o {assinatura.plano.nome}
            </Button>
          ) : null}
        </Recado>
      ) : null}

      {assinatura.cartao_aguardando_autorizacao ? (
        <Recado>
          O cartão ainda não foi autorizado no Mercado Pago. Até lá, a renovação continua pelo PIX.
          {presidente ? (
            <Button
              variant="outline"
              className="w-1/2"
              disabled={trocarMeio.isPending}
              onClick={() => trocarMeio.mutate('Cartao', { onError: avisarErro })}
            >
              Autorizar cartão
            </Button>
          ) : null}
        </Recado>
      ) : null}

      {presidente && assinatura.meio === 'Pix' ? (
        <div className="border-border grid gap-2 border-t pt-5">
          <h3 className="text-foreground text-sm font-medium">Renovação pelo PIX</h3>
          <TextoDoCartao>
            O PIX da renovação fica disponível sete dias antes de {vencimento}. Você paga na página do Mercado
            Pago, e a vigência se estende sozinha.
          </TextoDoCartao>
          <Button
            className="w-1/2"
            disabled={pagarCiclo.isPending || pagarCiclo.isSuccess}
            onClick={() => pagarCiclo.mutate(undefined, { onError: avisarErro })}
          >
            {pagarCiclo.isPending || pagarCiclo.isSuccess ? 'Indo para o pagamento…' : 'Pagar renovação'}
          </Button>
        </div>
      ) : null}

      {presidente && !assinatura.cartao_aguardando_autorizacao ? (
        <div className="border-border grid gap-2 border-t pt-5">
          <h3 className="text-foreground text-sm font-medium">Meio de pagamento</h3>
          <TextoDoCartao>
            {paraOPix
              ? 'Prefere pagar um PIX a cada ciclo? O débito automático no cartão para de ser usado.'
              : 'Prefere o débito automático? Cadastre o cartão, e a primeira cobrança sai no vencimento.'}
          </TextoDoCartao>
          <DialogoDeConfirmacao
            titulo={paraOPix ? 'Trocar para o PIX?' : 'Trocar para o cartão?'}
            descricao={
              paraOPix
                ? `O débito automático no cartão é cancelado agora. A partir da renovação de ${vencimento}, você paga um PIX por ciclo pela tela da assinatura.`
                : `Você vai à página do Mercado Pago cadastrar o cartão. A primeira cobrança é em ${vencimento}, e até lá nada muda.`
            }
            rotulo={paraOPix ? 'Trocar para o PIX' : 'Ir para o cartão'}
            aoConfirmar={() =>
              trocarMeio.mutate(paraOPix ? 'Pix' : 'Cartao', {
                onSuccess: ({ url }) => {
                  if (!url) toast.success('A renovação agora é pelo PIX.')
                },
                onError: avisarErro,
              })
            }
            gatilho={
              <Button variant="outline" className="w-1/2" disabled={trocarMeio.isPending}>
                {paraOPix ? 'Trocar para o PIX' : 'Trocar para o cartão'}
              </Button>
            }
          />
        </div>
      ) : null}
    </>
  )
}

/**
 * A desistência nos 7 dias do último pagamento (art. 49 do CDC), pelo mesmo meio da contratação: o app. A API só
 * manda `desistencia_ate` dentro do prazo, e é isso que faz a seção sumir depois — fica o cancelamento.
 *
 * Diferente do cancelamento, encerra na hora: o dinheiro volta e a turma fica só para consulta já. Por isso a
 * confirmação diz as duas coisas antes do botão.
 *
 * @param ate O `desistencia_ate` da assinatura.
 */
function Desistir({ ate }: { ate: string }) {
  const desistir = useDesistirDaAssinatura()

  return (
    <div className="border-border grid gap-2 border-t pt-5">
      <h3 className="text-foreground text-sm font-medium">Desistir da assinatura</h3>
      <TextoDoCartao>
        Até {formatarData(ate)}, você pode desistir e receber de volta todo o valor do último pagamento. Se
        usou cupom, o reembolso considera o valor com desconto.
      </TextoDoCartao>
      <DialogoDeConfirmacao
        titulo="Desistir da assinatura?"
        descricao="A renovação é cancelada e o valor efetivamente pago na última cobrança volta inteiro pelo Mercado Pago, no meio em que foi pago. Se usou cupom, é devolvido o valor com desconto. A turma fica só para consulta a partir de agora: todos continuam vendo tudo, mas ninguém registra nada novo. Nada é apagado."
        rotulo="Pedir reembolso"
        rotuloDeCancelar="Manter assinatura"
        destrutivo
        aoConfirmar={() =>
          desistir.mutate(undefined, {
            onSuccess: () => toast.info('Desistência confirmada. O reembolso foi pedido ao Mercado Pago.'),
            onError: avisarErro,
          })
        }
        gatilho={
          <Button variant="outline" className="w-1/2" disabled={desistir.isPending}>
            Pedir reembolso
          </Button>
        }
      />
    </div>
  )
}

/**
 * Cancelamento em duas etapas.
 *
 * A primeira diz, em texto claro, até quando o acesso continua e o que acontece depois (modo
 * leitura, nada apagado); só a segunda cancela. Cancelar sem essa informação é o caminho mais curto
 * para um pedido de estorno.
 */
function CancelarRenovacao({ vigenteAte }: { vigenteAte: string | null }) {
  const cancelar = useCancelarAssinatura()
  const [confirmando, definirConfirmando] = useState(false)
  const ate = formatarData(vigenteAte)

  return (
    <div className="border-border grid gap-2 border-t pt-5">
      <h3 className="text-foreground text-sm font-medium">Cancelar renovação</h3>
      <TextoDoCartao>
        Não haverá nova cobrança, e a turma continua funcionando até o fim do período já pago.
      </TextoDoCartao>

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
                      onError: avisarErro,
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
                  a registrar basta contratar de novo. Sem nova contratação em 12 meses, a turma é encerrada e
                  fica disponível para consulta por mais cinco anos.
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
    <TextoDoCartao as="div" className="bg-muted grid gap-3 rounded-xl px-4 py-3">
      {children}
    </TextoDoCartao>
  )
}

/**
 * A seta que leva do cartão à vitrine. Com a assinatura ativa nada na tela levava aos planos — o
 * único caminho era digitar a URL.
 */
function AtalhoParaPlanos() {
  return (
    <Dica dica="Ver planos">
      <Button asChild variant="ghost" size="icon" className="text-muted-foreground -my-1 size-8">
        <LinkDaPagina to={ROTAS.planos} aria-label="Ver planos">
          <ArrowUpRight aria-hidden />
        </LinkDaPagina>
      </Button>
    </Dica>
  )
}

function IrParaPlanos({ children }: { children: ReactNode }) {
  return (
    <Button asChild className="w-1/2">
      <LinkDaPagina to={ROTAS.planos}>{children}</LinkDaPagina>
    </Button>
  )
}
