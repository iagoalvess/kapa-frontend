import { CalendarClock, Mail, Minus, Plus, UserRound } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import { TextoDoCartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { RodapeDeDialogo } from '@/components/RodapeDeDialogo'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
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
import { chaves } from '../hooks/chaves'

/** O que dizer quando o Mercado Pago devolve o navegador com erro — pelo `codigo`, nunca pela mensagem. */
const ERROS_DO_RETORNO: Record<string, string> = {
  'recebimento.retorno_invalido': 'O link de autorização venceu. Clique em Conectar de novo.',
  'recebimento.somente_presidente': 'Só o Presidente conecta o Mercado Pago da turma.',
  'recebimento.autorizacao_recusada': 'O Mercado Pago não autorizou. Tente conectar de novo.',
  'recebimento.conta_fora_do_brasil':
    'Essa conta do Mercado Pago não é do Brasil. Conecte a conta brasileira da turma.',
}

/**
 * A conexão no cabeçalho de Recebimentos da turma; conta, cartão e desconexão no diálogo próprio.
 *
 * Só o Presidente escreve (P3); a tesouraria vê a conta conectada. O passo a passo é do Kapinha, num
 * `<details>` que abre no próprio cartão: é o que o presidente precisa ler antes de sair do Kapa para o
 * site do Mercado Pago. O retorno da autorização volta para esta tela com `?mercado_pago=…`, e o cartão
 * avisa e limpa a URL.
 */
export function AcoesDoMercadoPago() {
  const queryClient = useQueryClient()
  const consulta = useMercadoPago()
  const conta = useContaDeRecebimento()
  const { ehPresidente, tem } = usePapel()
  const liberado = useEscritaLiberada()
  const conectar = useConectarMercadoPago()
  const [gerenciando, definirGerenciando] = useState(false)
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const { hash, state } = useLocation()
  const retorno = parametros.get('mercado_pago')
  const codigo = parametros.get('codigo')

  // O aviso do retorno aparece uma vez, e a URL volta a ser a da tela: recarregar não repete o toast.
  useEffect(() => {
    if (!retorno) return

    if (retorno === 'conectado') {
      void queryClient.invalidateQueries({ queryKey: chaves.mercadoPago() })
      toast.success(
        'Mercado Pago conectado. A loja pode receber por esta conta; a cobrança dos formandos mantém a configuração atual.',
      )
    } else
      toast.error(
        (codigo && ERROS_DO_RETORNO[codigo]) ?? 'Não deu para conectar o Mercado Pago. Tente de novo.',
      )

    const restantes = new URLSearchParams(parametros)
    restantes.delete('mercado_pago')
    restantes.delete('codigo')
    navegar({ search: restantes.toString(), hash }, { replace: true, preventScrollReset: true, state })
  }, [retorno, codigo, parametros, navegar, queryClient, hash, state])

  if (consulta.isPending || consulta.isError) return null

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

  if (!provedor)
    return escreve ? (
      <Button
        variant="outline"
        size="sm"
        onClick={conectarAgora}
        disabled={conectar.isPending || conta.isPending || conta.isError || !conta.data?.conta?.meios.pix}
      >
        {conectar.isPending ? 'Enviando o link…' : 'Conectar Mercado Pago'}
      </Button>
    ) : null

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => definirGerenciando(true)}>
        Mercado Pago
      </Button>
      <DialogoDeFormulario
        aberto={gerenciando}
        aoFechar={() => definirGerenciando(false)}
        titulo="Mercado Pago da turma"
        descricao="A conta e o cartão usados na cobrança automática dos formandos e na loja pública."
      >
        <Conectado provedor={provedor} />
        <CartaoDaTurma cartao={provedor.cartao} escreve={tem(PAPEIS.tesoureiro) && liberado} />
        {escreve ? (
          <div className="flex flex-wrap gap-2">
            <AcoesDaConta aoTrocar={conectarAgora} trocando={conectar.isPending} />
          </div>
        ) : null}
        <RodapeDeDialogo variante="unico">
          <Button variant="outline" onClick={() => definirGerenciando(false)}>
            Fechar
          </Button>
        </RodapeDeDialogo>
      </DialogoDeFormulario>
    </>
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
        descricao="Para desconectar, a cobrança dos formandos precisa estar em conferência manual e as vendas da loja pública devem estar encerradas. A comissão recebe um e-mail, e pagamentos já gerados ainda podem ser pagos até vencer."
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
        <span className="break-all">{provedor.conta_no_provedor}</span>
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
 * O passo a passo do Kapinha: o que o presidente precisa ter e o que vai acontecer quando clicar.
 */
export function AjudaDoMercadoPago() {
  return (
    <details className="group/detalhe">
      <summary className="text-foreground focus-visible:ring-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-3 text-sm focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <span>O Kapinha explica</span>
        <Plus className="text-brand-text size-4 shrink-0 group-open/detalhe:hidden" aria-hidden />
        <Minus className="text-brand-text hidden size-4 shrink-0 group-open/detalhe:block" aria-hidden />
      </summary>
      <div className="flex flex-wrap items-start gap-4 pb-4">
        <img src={mascoteChecklist} alt="" className="w-20 shrink-0 drop-shadow-lg" />
        <TextoDoCartao as="div" className="grid min-w-0 flex-1 basis-64 gap-3">
          <ol className="text-foreground grid list-inside list-decimal gap-1.5">
            <li>Tenha uma conta no Mercado Pago para receber os pagamentos da turma.</li>
            <li>
              Clique em <strong>Conectar Mercado Pago</strong>. O Presidente recebe por e-mail um link para
              autorizar a conexão.
            </li>
            <li>
              Abra o link recebido, entre na conta Mercado Pago que receberá os pagamentos e clique em{' '}
              <strong>Autorizar</strong>.
            </li>
            <li>
              Ao terminar, você volta ao Kapa com a conta conectada. A comissão também recebe um e-mail de
              confirmação.
            </li>
            <li>
              Para cobrar os formandos pelo Mercado Pago, clique em <strong>Editar</strong>, selecione
              “Confirmação automática”, salve e confirme a troca. Para usar a conta apenas na loja pública,
              mantenha a conferência manual.
            </li>
            <li>
              Para vender na loja pública, a turma precisa do Mercado Pago conectado, de um plano que inclua a
              festa e de itens à venda na loja.
            </li>
          </ol>
        </TextoDoCartao>
      </div>
    </details>
  )
}
