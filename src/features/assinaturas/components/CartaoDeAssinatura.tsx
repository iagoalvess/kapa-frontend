import { ArrowUpRight } from 'lucide-react'
import { type ReactNode } from 'react'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { Dica } from '@/components/Dica'
import { EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import { ehErroDaApi } from '@/lib/http/erros'
import { MEIOS_DE_PAGAMENTO } from '@/types/pagamento'
import { useAssinatura } from '../hooks/useAssinatura'
import type { Assinatura } from '../types/assinaturas.types'
import { SeloDeStatus } from './SeloDeStatus'

/**
 * Resumo do status, plano, vigência e próxima cobrança. A gestão da assinatura fica em Planos. Mora na
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

      {dados.proximo_plano ? (
        <TextoDoCartao>
          A partir da renovação, o plano passa a ser o {dados.proximo_plano.nome}.
        </TextoDoCartao>
      ) : null}
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
    <Button asChild className="w-full">
      <LinkDaPagina to={ROTAS.planos}>{children}</LinkDaPagina>
    </Button>
  )
}
