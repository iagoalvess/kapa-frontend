import { CalendarClock, Mail, Minus, Plus, UserRound, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeCartao, EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { useContaDeRecebimento } from '../hooks/useContaDeRecebimento'
import { formatarDataHora } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { PAPEIS } from '@/config/perfis'
import { useConectarMercadoPago, useDesconectarMercadoPago, useMercadoPago } from '../hooks/useMercadoPago'
import type { ProvedorConectado } from '../types/recebimentos.types'
import { CartaoDaTurma } from './CartaoDaTurma'
import { ModoDaCobranca } from './ModoDaCobranca'

/** O que dizer quando o Mercado Pago devolve o navegador com erro — pelo `codigo`, nunca pela mensagem. */
const ERROS_DO_RETORNO: Record<string, string> = {
  'recebimento.retorno_invalido': 'O link de autorização venceu. Clique em Conectar de novo.',
  'recebimento.somente_presidente': 'Só o Presidente conecta o Mercado Pago da turma.',
  'recebimento.autorizacao_recusada': 'O Mercado Pago não autorizou. Tente conectar de novo.',
  'recebimento.conta_fora_do_brasil':
    'Essa conta do Mercado Pago não é do Brasil. Conecte a conta brasileira da turma.',
}

/**
 * O Mercado Pago da turma (Sprint 25), abaixo dos meios de recebimento: conectar por OAuth e
 * desconectar. A conta recebe as vendas da loja pública. A cobrança dos formandos é uma escolha separada,
 * na escolha de conferência manual ou confirmação automática.
 *
 * Só o Presidente escreve (P3); a tesouraria vê a conta conectada. O passo a passo é do Kapinha, num
 * `<details>` que abre no próprio cartão: é o que o presidente precisa ler antes de sair do Kapa para o
 * site do Mercado Pago. O retorno da autorização volta para esta tela com `?mercado_pago=…`, e o cartão
 * avisa e limpa a URL.
 */
export function CartaoDoMercadoPago({
  embutido = false,
  apenasLoja = false,
}: {
  embutido?: boolean
  apenasLoja?: boolean
}) {
  const consulta = useMercadoPago()
  const conta = useContaDeRecebimento()
  const { ehPresidente, tem } = usePapel()
  const liberado = useEscritaLiberada()
  const conectar = useConectarMercadoPago()
  const [parametros, definirParametros] = useSearchParams()
  const retorno = parametros.get('mercado_pago')
  const codigo = parametros.get('codigo')

  // O aviso do retorno aparece uma vez, e a URL volta a ser a da tela: recarregar não repete o toast.
  useEffect(() => {
    if (!retorno) return

    if (retorno === 'conectado')
      toast.success(
        'Mercado Pago conectado. A loja pode receber por esta conta; a cobrança dos formandos mantém a configuração atual.',
      )
    else
      toast.error(
        (codigo && ERROS_DO_RETORNO[codigo]) ?? 'Não deu para conectar o Mercado Pago. Tente de novo.',
      )

    definirParametros({}, { replace: true, preventScrollReset: true })
  }, [retorno, codigo, definirParametros])

  if (consulta.isPending)
    return (
      <EsqueletoDeCartao className={embutido ? 'p-0 shadow-none' : undefined}>
        <EsqueletoDeDados linhas={2} />
      </EsqueletoDeCartao>
    )

  if (consulta.isError)
    return <ErroDaConsulta compacto erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />

  const { provedor } = consulta.data
  const escreve = ehPresidente && liberado
  const conectarAgora = () =>
    conectar.mutate(undefined, {
      onSuccess: ({ enviada_para }) =>
        toast.success(
          `Enviamos para ${enviada_para} o link para autorizar no Mercado Pago. Ele vale 15 minutos.`,
        ),
      onError: avisarErro,
    })

  return (
    <Cartao
      titulo={embutido && apenasLoja ? 'Loja pública' : 'Mercado Pago'}
      icone={embutido ? undefined : Zap}
      className={embutido ? 'rounded-none p-0 shadow-none [&_h2]:text-base' : undefined}
      selo={provedor ? <Selo tom="sucesso">Conectado</Selo> : <Selo tom="neutro">Não conectado</Selo>}
      descricao={
        apenasLoja
          ? 'As vendas são recebidas pelo Mercado Pago.'
          : 'O dinheiro cai na conta Mercado Pago da turma.'
      }
      acao={
        !escreve ? null : provedor ? (
          <AcoesDaConta aoTrocar={conectarAgora} trocando={conectar.isPending} />
        ) : (
          <Button
            size="sm"
            onClick={conectarAgora}
            disabled={conectar.isPending || conta.isPending || conta.isError || !conta.data?.conta?.meios.pix}
          >
            {conectar.isPending ? 'Enviando o link…' : 'Conectar Mercado Pago'}
          </Button>
        )
      }
    >
      {!embutido ? (
        <ModoDaCobranca
          desde={provedor?.cobranca_automatica_em ?? null}
          conectado={Boolean(provedor)}
          escreve={tem(PAPEIS.tesoureiro) && liberado}
        />
      ) : null}
      {!apenasLoja ? (
        <p className="text-muted-foreground text-sm">A loja pública também usa esta conta.</p>
      ) : null}
      {provedor ? (
        <>
          {embutido ? (
            <details className="group/detalhe">
              <summary className="text-foreground focus-visible:ring-ring flex min-h-11 cursor-pointer list-none items-start justify-between gap-3 rounded-lg py-3 text-sm focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                <span>
                  Conta conectada: <span className="break-all">{provedor.conta_no_provedor}</span>
                </span>
                <Plus className="text-brand-text size-4 shrink-0 group-open/detalhe:hidden" aria-hidden />
                <Minus
                  className="text-brand-text hidden size-4 shrink-0 group-open/detalhe:block"
                  aria-hidden
                />
              </summary>
              <div className="pt-3">
                <Conectado provedor={provedor} />
              </div>
            </details>
          ) : (
            <Conectado provedor={provedor} />
          )}
          {embutido && apenasLoja ? (
            <details className="group/detalhe">
              <summary className="text-foreground focus-visible:ring-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-3 text-sm focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                <span>Cartão de crédito e taxas</span>
                <Plus className="text-brand-text size-4 shrink-0 group-open/detalhe:hidden" aria-hidden />
                <Minus
                  className="text-brand-text hidden size-4 shrink-0 group-open/detalhe:block"
                  aria-hidden
                />
              </summary>
              <div className="pt-2">
                <CartaoDaTurma cartao={provedor.cartao} escreve={tem(PAPEIS.tesoureiro) && liberado} />
              </div>
            </details>
          ) : (
            <CartaoDaTurma cartao={provedor.cartao} escreve={tem(PAPEIS.tesoureiro) && liberado} />
          )}
        </>
      ) : (
        <>
          {apenasLoja ? <TextoDoCartao>Conectar não muda o pagamento manual.</TextoDoCartao> : null}
          {conta.isError ? (
            <ErroDaConsulta compacto erro={conta.error} aoTentarDeNovo={() => void conta.refetch()} />
          ) : !conta.isPending && !conta.data?.conta?.meios.pix ? (
            <TextoDoCartao>Cadastre uma chave PIX antes de conectar.</TextoDoCartao>
          ) : null}
          {escreve ? null : <TextoDoCartao>Quem conecta é o Presidente da turma.</TextoDoCartao>}
        </>
      )}

      <PassoAPasso conectado={Boolean(provedor)} />
    </Cartao>
  )
}

/**
 * Trocar de conta e desconectar, no canto do cabeçalho como as ações dos outros cartões.
 *
 * @param aoTrocar Conectar de novo — outra conta substitui a atual.
 */
function AcoesDaConta({ aoTrocar, trocando }: { aoTrocar: () => void; trocando: boolean }) {
  const desconectar = useDesconectarMercadoPago()

  return (
    <>
      <Button variant="outline" size="sm" onClick={aoTrocar} disabled={trocando}>
        Trocar de conta
      </Button>
      <DialogoDeConfirmacao
        titulo="Desconectar o Mercado Pago?"
        descricao="Os formandos continuam pagando pelos meios da comissão. Com convite à venda na loja pública, encerre as vendas antes: ela só vende pelo Mercado Pago. A comissão recebe um e-mail, e pagamentos já gerados ainda podem ser pagos até vencer."
        rotulo="Desconectar"
        destrutivo
        gatilho={
          <Button variant="outline" size="sm" disabled={desconectar.isPending}>
            Desconectar
          </Button>
        }
        aoConfirmar={() =>
          desconectar.mutate(undefined, {
            onSuccess: () => toast.info('Mercado Pago desconectado.'),
            onError: avisarErro,
          })
        }
      />
    </>
  )
}

/** A conta conectada. */
function Conectado({ provedor }: { provedor: ProvedorConectado }) {
  return (
    <ListaDeDados rotulo="Conta conectada">
      <Dado icone={Mail} rotulo="Conta do Mercado Pago">
        {provedor.conta_no_provedor}
      </Dado>
      <Dado icone={UserRound} rotulo="Conectada por">
        {provedor.conectado_por ?? '—'}
      </Dado>
      <Dado icone={CalendarClock} rotulo="Desde">
        {formatarDataHora(provedor.conectado_em)}
      </Dado>
    </ListaDeDados>
  )
}

/**
 * O passo a passo do Kapinha: o que o presidente precisa ter e o que vai acontecer quando clicar — e o
 * risco que a Sprint 25 pede para deixar na tela de conectar (retenção cautelar).
 */
function PassoAPasso({ conectado }: { conectado: boolean }) {
  return (
    <details className="group/detalhe">
      <summary className="text-foreground focus-visible:ring-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-3 text-sm focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <span>{conectado ? 'Sobre a conexão com o Mercado Pago' : 'Como conectar? O Kapinha explica'}</span>
        <Plus className="text-brand-text size-4 shrink-0 group-open/detalhe:hidden" aria-hidden />
        <Minus className="text-brand-text hidden size-4 shrink-0 group-open/detalhe:block" aria-hidden />
      </summary>
      <div className="flex flex-wrap items-start gap-4 pb-4">
        <img src={mascoteChecklist} alt="" className="w-20 shrink-0 drop-shadow-lg" />
        <TextoDoCartao as="div" className="grid min-w-0 flex-1 basis-64 gap-3">
          <ol className="text-foreground grid list-inside list-decimal gap-1.5">
            <li>Tenha uma conta no Mercado Pago para a turma — a de quem cuida do dinheiro serve.</li>
            <li>
              Aqui no Kapa, clique em <strong>Conectar Mercado Pago</strong>. O Presidente recebe por e-mail o
              link para autorizar a conexão.
            </li>
            <li>
              Abra o link recebido, entre com a conta da turma no Mercado Pago e clique em
              <strong> Autorizar</strong>.
            </li>
            <li>Você volta para esta tela já conectado, e a comissão recebe um e-mail.</li>
            <li>
              Para cobrar os formandos com confirmação automática, escolha{' '}
              <strong>Confirmação automática</strong>. Para usar a conta só na loja pública, mantenha{' '}
              <strong>Conferência manual</strong>.
            </li>
          </ol>
          <p className="text-muted-foreground">
            Não precisa copiar chave nem senha: o Kapa só ganha permissão para gerar cobranças e ver se foram
            pagas. Para tirar a permissão, desconecte aqui ou no próprio Mercado Pago.
          </p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">Atenção:</strong> o dinheiro fica na conta Mercado Pago até
            você transferir para o banco, e conta de pessoa física com movimento alto pode ter o saldo retido
            pelo Mercado Pago para análise. Transfira com frequência.
          </p>
        </TextoDoCartao>
      </div>
    </details>
  )
}
