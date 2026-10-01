import { CalendarClock, CircleHelp, Mail, UserRound, Zap } from 'lucide-react'
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
 * desconectar. Com ele, o formando ganha o PIX com confirmação automática — a parcela baixa sozinha, sem
 * a conferência da tesouraria.
 *
 * Só o Presidente escreve (P3); a tesouraria vê a conta conectada. O passo a passo é do Kapinha, num
 * `<details>` que abre no próprio cartão: é o que o presidente precisa ler antes de sair do Kapa para o
 * site do Mercado Pago. O retorno da autorização volta para esta tela com `?mercado_pago=…`, e o cartão
 * avisa e limpa a URL.
 */
export function CartaoDoMercadoPago() {
  const consulta = useMercadoPago()
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
        'Mercado Pago conectado. Ligue a cobrança pelo Mercado Pago para os formandos pagarem por ele.',
      )
    else
      toast.error(
        (codigo && ERROS_DO_RETORNO[codigo]) ?? 'Não deu para conectar o Mercado Pago. Tente de novo.',
      )

    definirParametros({}, { replace: true })
  }, [retorno, codigo, definirParametros])

  if (consulta.isPending)
    return (
      <EsqueletoDeCartao>
        <EsqueletoDeDados linhas={2} />
      </EsqueletoDeCartao>
    )

  if (consulta.isError) return <ErroDaConsulta erro={consulta.error} />

  const { provedor } = consulta.data
  const escreve = ehPresidente && liberado
  const conectarAgora = () => conectar.mutate(undefined, { onError: avisarErro })

  return (
    <Cartao
      titulo="Mercado Pago"
      icone={Zap}
      selo={provedor ? <Selo tom="sucesso">Conectado</Selo> : <Selo tom="neutro">Não conectado</Selo>}
      descricao="PIX e cartão com confirmação automática, direto na conta da turma."
      acao={
        !escreve ? null : provedor ? (
          <AcoesDaConta aoTrocar={conectarAgora} trocando={conectar.isPending} />
        ) : (
          <Button size="sm" onClick={conectarAgora} disabled={conectar.isPending}>
            {conectar.isPending ? 'Abrindo o Mercado Pago…' : 'Conectar Mercado Pago'}
          </Button>
        )
      }
    >
      {provedor ? (
        <>
          <Conectado provedor={provedor} />
          <ModoDaCobranca
            desde={provedor.cobranca_automatica_em}
            escreve={tem(PAPEIS.tesoureiro) && liberado}
          />
          <CartaoDaTurma cartao={provedor.cartao} escreve={tem(PAPEIS.tesoureiro) && liberado} />
        </>
      ) : (
        <>
          <TextoDoCartao>
            Conectando a conta Mercado Pago da turma e ligando a cobrança por ele, o formando paga por um PIX
            gerado na hora e a parcela muda para paga sozinha — sem aviso e sem conferência da tesouraria. O
            dinheiro cai direto na conta da turma; o Kapa não toca nele.
          </TextoDoCartao>
          {escreve ? null : <TextoDoCartao>Quem conecta é o Presidente da turma.</TextoDoCartao>}
        </>
      )}

      <PassoAPasso />
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
function PassoAPasso() {
  return (
    <details className="group bg-brand-wash rounded-2xl">
      <summary className="text-brand-text flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium">
        <CircleHelp className="size-4 shrink-0" aria-hidden />
        Como conectar? O Kapinha explica
      </summary>
      <div className="flex flex-wrap items-start gap-4 px-4 pb-4">
        <img src={mascoteChecklist} alt="" className="w-20 shrink-0 drop-shadow-lg" />
        <TextoDoCartao as="div" className="grid min-w-0 flex-1 basis-64 gap-3">
          <ol className="text-foreground grid list-inside list-decimal gap-1.5">
            <li>Tenha uma conta no Mercado Pago para a turma — a de quem cuida do dinheiro serve.</li>
            <li>
              Aqui no Kapa, clique em <strong>Conectar Mercado Pago</strong>. Você vai para o site do Mercado
              Pago.
            </li>
            <li>
              Entre com a conta da turma e clique em <strong>Autorizar</strong>.
            </li>
            <li>Você volta para esta tela já conectado, e a comissão recebe um e-mail.</li>
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
